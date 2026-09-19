package controllers

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/v2/bson"
	"live-polling-tool/config"
	"live-polling-tool/models"
)

type PollController struct{}

type createPollInput struct {
	Question string   `json:"question"`
	Options  []string `json:"options"`
}
type voteInput struct {
	OptionID string `json:"optionId" binding:"required"`
}

func (p *PollController) Create(c *gin.Context) {
	var input createPollInput
	if c.ShouldBindJSON(&input) != nil || len([]rune(strings.TrimSpace(input.Question))) < 5 || len(input.Options) < 2 || len(input.Options) > 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Add a question and between 2 and 6 options"})
		return
	}
	options := make([]models.PollOption, 0, len(input.Options))
	seen := map[string]bool{}
	for _, raw := range input.Options {
		label := strings.TrimSpace(raw)
		if len([]rune(label)) < 1 || len([]rune(label)) > 80 || seen[strings.ToLower(label)] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Options must be unique and 1-80 characters"})
			return
		}
		seen[strings.ToLower(label)] = true
		options = append(options, models.PollOption{ID: uuid.NewString(), Label: label})
	}
	poll := models.Poll{ID: uuid.NewString(), OwnerID: c.GetString("userId"), Question: strings.TrimSpace(input.Question), Options: options, CreatedAt: time.Now()}
	ctx, cancel := context.WithTimeout(c, 5*time.Second)
	defer cancel()
	if _, err := config.MongoDB.Collection("polls").InsertOne(ctx, poll); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save poll"})
		return
	}
	initializeCounts(ctx, poll)
	c.JSON(http.StatusCreated, poll)
}

func (p *PollController) Get(c *gin.Context) {
	poll, result, ok := loadPoll(c, c.Param("id"))
	if !ok {
		return
	}
	c.JSON(http.StatusOK, gin.H{"poll": poll, "result": result})
}

func (p *PollController) Vote(c *gin.Context) {
	var input voteInput
	if c.ShouldBindJSON(&input) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Choose an option"})
		return
	}
	poll, _, ok := loadPoll(c, c.Param("id"))
	if !ok {
		return
	}
	valid := false
	for _, option := range poll.Options {
		if option.ID == input.OptionID {
			valid = true
		}
	}
	if !valid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "That option does not belong to this poll"})
		return
	}
	voterKey := voterHash(c)
	ctx, cancel := context.WithTimeout(c, 5*time.Second)
	defer cancel()
	claimed, err := config.RedisClient.SetNX(ctx, "poll:voter:"+poll.ID+":"+voterKey, input.OptionID, 30*24*time.Hour).Result()
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Realtime service unavailable"})
		return
	}
	if !claimed {
		c.JSON(http.StatusConflict, gin.H{"error": "You have already voted in this poll"})
		return
	}
	config.RedisClient.HIncrBy(ctx, "poll:counts:"+poll.ID, input.OptionID, 1)
	vote := models.Vote{ID: uuid.NewString(), PollID: poll.ID, OptionID: input.OptionID, VoterKey: voterKey, CreatedAt: time.Now()}
	if _, err = config.MongoDB.Collection("votes").InsertOne(ctx, vote); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not record vote"})
		return
	}
	result := getCounts(ctx, poll)
	payload, _ := json.Marshal(result)
	config.RedisClient.Publish(ctx, "poll:events:"+poll.ID, payload)
	c.JSON(http.StatusCreated, result)
}

func (p *PollController) Stream(c *gin.Context) {
	poll, _, ok := loadPoll(c, c.Param("id"))
	if !ok {
		return
	}
	ctx, cancel := context.WithCancel(c)
	defer cancel()
	pubsub := config.RedisClient.Subscribe(ctx, "poll:events:"+poll.ID)
	defer pubsub.Close()
	if _, err := pubsub.Receive(ctx); err != nil {
		return
	}
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")
	c.Stream(func(w io.Writer) bool {
		select {
		case message := <-pubsub.Channel():
			fmt.Fprintf(w, "data: %s\n\n", message.Payload)
			return true
		case <-ctx.Done():
			return false
		}
	})
}

func loadPoll(c *gin.Context, id string) (models.Poll, models.PollResult, bool) {
	ctx, cancel := context.WithTimeout(c, 5*time.Second)
	defer cancel()
	var poll models.Poll
	if config.MongoDB.Collection("polls").FindOne(ctx, bson.M{"_id": id}).Decode(&poll) != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll not found"})
		return poll, models.PollResult{}, false
	}
	return poll, getCounts(ctx, poll), true
}
func initializeCounts(ctx context.Context, poll models.Poll) {
	values := map[string]interface{}{}
	for _, option := range poll.Options {
		values[option.ID] = 0
	}
	if len(values) > 0 {
		config.RedisClient.HSet(ctx, "poll:counts:"+poll.ID, values)
	}
}
func getCounts(ctx context.Context, poll models.Poll) models.PollResult {
	raw, _ := config.RedisClient.HGetAll(ctx, "poll:counts:"+poll.ID).Result()
	counts := map[string]int{}
	total := 0
	for _, option := range poll.Options {
		var count int
		fmt.Sscanf(raw[option.ID], "%d", &count)
		counts[option.ID] = count
		total += count
	}
	return models.PollResult{PollID: poll.ID, Counts: counts, Total: total}
}
func voterHash(c *gin.Context) string {
	value := c.ClientIP() + ":" + c.GetHeader("User-Agent")
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}
