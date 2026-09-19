package models

import "time"

type User struct {
	ID           string    `bson:"_id,omitempty" json:"id"`
	Name         string    `bson:"name" json:"name"`
	Email        string    `bson:"email" json:"email"`
	PasswordHash string    `bson:"passwordHash" json:"-"`
	CreatedAt    time.Time `bson:"createdAt" json:"createdAt"`
}

type PollOption struct {
	ID    string `bson:"id" json:"id"`
	Label string `bson:"label" json:"label"`
}

type Poll struct {
	ID        string       `bson:"_id,omitempty" json:"id"`
	OwnerID   string       `bson:"ownerId" json:"ownerId"`
	Question  string       `bson:"question" json:"question"`
	Options   []PollOption `bson:"options" json:"options"`
	CreatedAt time.Time    `bson:"createdAt" json:"createdAt"`
	Closed    bool         `bson:"closed" json:"closed"`
}

type Vote struct {
	ID        string    `bson:"_id,omitempty" json:"id"`
	PollID    string    `bson:"pollId" json:"pollId"`
	OptionID  string    `bson:"optionId" json:"optionId"`
	VoterKey  string    `bson:"voterKey" json:"-"`
	CreatedAt time.Time `bson:"createdAt" json:"createdAt"`
}

type PollResult struct {
	PollID string         `json:"pollId"`
	Counts map[string]int `json:"counts"`
	Total  int            `json:"total"`
}
