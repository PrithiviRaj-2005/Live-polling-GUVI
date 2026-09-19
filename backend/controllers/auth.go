package controllers

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/v2/bson"
	"golang.org/x/crypto/bcrypt"
	"live-polling-tool/config"
	"live-polling-tool/models"
)

type AuthController struct{}

type authPayload struct {
	Name     string `json:"name"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type tokenPayload struct {
	UserID  string `json:"userId"`
	Expires int64  `json:"expires"`
}

func (a *AuthController) Signup(c *gin.Context) {
	var input authPayload
	if err := c.ShouldBindJSON(&input); err != nil || strings.TrimSpace(input.Name) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name, valid email, and a 6+ character password are required"})
		return
	}
	ctx, cancel := context.WithTimeout(c, 5*time.Second)
	defer cancel()
	email := strings.ToLower(strings.TrimSpace(input.Email))
	var existing models.User
	if err := config.MongoDB.Collection("users").FindOne(ctx, bson.M{"email": email}).Decode(&existing); err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "An account with that email already exists"})
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create account"})
		return
	}
	user := models.User{ID: uuid.NewString(), Name: strings.TrimSpace(input.Name), Email: email, PasswordHash: string(hash), CreatedAt: time.Now()}
	if _, err = config.MongoDB.Collection("users").InsertOne(ctx, user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not create account"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"token": makeToken(user.ID), "user": user})
}

func (a *AuthController) Login(c *gin.Context) {
	var input authPayload
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Valid email and password are required"})
		return
	}
	ctx, cancel := context.WithTimeout(c, 5*time.Second)
	defer cancel()
	var user models.User
	err := config.MongoDB.Collection("users").FindOne(ctx, bson.M{"email": strings.ToLower(strings.TrimSpace(input.Email))}).Decode(&user)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Email or password is incorrect"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"token": makeToken(user.ID), "user": user})
}

func (a *AuthController) Me(c *gin.Context) {
	user, ok := c.Get("user")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": user})
}

func makeToken(userID string) string {
	payload, _ := json.Marshal(tokenPayload{UserID: userID, Expires: time.Now().Add(7 * 24 * time.Hour).Unix()})
	encoded := base64.RawURLEncoding.EncodeToString(payload)
	h := hmac.New(sha256.New, []byte(os.Getenv("JWT_SECRET")))
	h.Write([]byte(encoded))
	return encoded + "." + base64.RawURLEncoding.EncodeToString(h.Sum(nil))
}

func ParseToken(token string) (string, bool) {
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return "", false
	}
	h := hmac.New(sha256.New, []byte(os.Getenv("JWT_SECRET")))
	h.Write([]byte(parts[0]))
	signature, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil || !hmac.Equal(signature, h.Sum(nil)) {
		return "", false
	}
	data, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return "", false
	}
	var payload tokenPayload
	if json.Unmarshal(data, &payload) != nil || payload.Expires < time.Now().Unix() {
		return "", false
	}
	return payload.UserID, true
}
