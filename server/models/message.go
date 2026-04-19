package models

import "gorm.io/gorm"

type Message struct {

	gorm.Model
	SenderID 		uint		`gorm:"not null"`
	ReceiverID 		uint		`gorm:"not null"`
	Content 		string 		`gorm:"type:text;not null"`
	isRead 			bool 		`gorm:"default:false"`

}

type SendMessageRequest struct {
	Email 	string 	`json:"email"`
	Content	string 	`json:"content"`
}