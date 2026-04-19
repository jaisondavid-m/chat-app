package models

import (
	"time"

	"gorm.io/gorm"
)

type Message struct {

	gorm.Model
	SenderID 		uint		`gorm:"not null"`
	ReceiverID 		uint		`gorm:"not null"`
	Content 		string 		`gorm:"type:text;not null"`
	IsRead 			bool 		`gorm:"default:false"`
	ReadAt			*time.Time
}

type SendMessageRequest struct {
	Email 	string 	`json:"email"`
	Content	string 	`json:"content"`
}