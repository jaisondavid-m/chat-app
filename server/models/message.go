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
	ImageURL		string		`gorm:"type:text"`
	IsRead 			bool 		`gorm:"default:false"`
	ReadAt			*time.Time
}

type SendMessageRequest struct {
	Email 		string 		`json:"email"`
	Content		string 		`json:"content"`
	ImageURL 	string 		`json:"image_url"`
}