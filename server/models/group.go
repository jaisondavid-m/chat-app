package models

import (
	"time"
	"gorm.io/gorm"
)

type Group struct {
	gorm.Model
	Name			string		`gorm:"size:120;not null"`
	Description 	string 		`gorm:"size:500"`
	Avatar 			string 		`gorm:"type:text"`
	CreatedBy 		uint 		`gorm:"not null"`
	IsActive 		bool 		`gorm:"default:true"`
}

type GroupMember struct {
	gorm.Model
	GroupID 	uint 		`gorm:"not null;uniqueIndex:idx_group_member,priority:1"`
	UserID 		uint 		`gorm:"not null;uniqueIndex:idx_group_member,priority:2"`
	Role 		string 		`gorm:"size:20;default:member"`
	IsActive 	bool 		`gorm:"default:true"`
}

type GroupMessage struct {
	gorm.Model
	GroupID	 	uint 		`gorm:"not null;index"`
	SenderID 	uint 		`gorm:"not null"`
	Content 	string 		`gorm:"type:text"`
	ImageURL 	string 		`gorm:"type:text"`
	IsEdited 	bool 		`gorm:"default:false"`
	EditedAt 	time.Time
	IsDeleted 	bool 		`gorm:"default:false"`
	Reaction 	string 		`gorm:"size:20"`
	Latitude 	float64 	`gorm:"default:0"`
	Longitude 	float64 	`gorm:"default:0"`
	IsLocation 	bool 		`gorm:"default:false"`
}

type GroupMessageRead struct {
	gorm.Model
	MessageID 	uint 		`gorm:"not null;unqiueIndex:idx_msg_reader,priority:1"`
	UserID 		uint 		`gorm:"not null;uniqueIndex:idx_msg_reader,priority:2"`
	ReadAt 		*time.Time
}

type CreateGroupRequest struct {
	Name 			string 		`json:"name" binding:"required"`
	Description 	string 		`json:"description"`
	MemberEmails 	[]string 	`json:"member_emails"`
}

type SendGroupMessageRequest struct {
	Content 	string 		`json:"content"`
	ImageURL 	string 		`json:"image_url"`
	Latitude 	float64 	`json:"latitude"`
	Longitude 	float64 	`json:"longitude"`
	IsLocation 	bool 		`json:"is_location"`
}

type UpdateGroupRequest struct {
	Name 			string 		`json:"name"`
	Description 	string 		`json:"description"`
	Avatar 			string 		`json:"avatar"`
}