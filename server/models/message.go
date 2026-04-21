package models

import (
	"time"

	"gorm.io/gorm"
)

type Message struct {

	gorm.Model
	ID 				uint		`gorm:"primaryKey"`
	SenderID 		uint		`gorm:"not null"`
	ReceiverID 		uint		`gorm:"not null"`
	Content 		string 		`gorm:"type:text;not null"`
	ImageURL		string		`gorm:"type:text"`
	IsRead 			bool 		`gorm:"index"`
	ReadAt			*time.Time
	IsEdited 		bool 		`gorm:"default:false"`
	EditedAt 		*time.Time
	IsDeleted 		bool		`gorm:"default:false"`
	Reaction		string		`gorm:"size:20"`
	Latitude		float64		`gorm:"default:0"`
	Longitude		float64		`gorm:"default:0"`
	IsLocation		bool		`gorm:"default:false"`
	IsViewOnce		bool		`gorm:"default:false"`
	ViewedAt		*time.Time
}

type SendMessageRequest struct {
	Email 		string 		`json:"email"`
	Content		string 		`json:"content"`
	ImageURL 	string 		`json:"image_url"`
	Latitude	float64		`json:"latitude"`
	Longitude	float64		`json:"longitude"`
	IsLocation	bool		`json:"is_location"`
	IsViewOnce	bool 		`json:"is_view_once"`
}