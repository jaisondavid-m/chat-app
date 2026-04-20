package models

import "gorm.io/gorm"

type FriendRequest struct {
	gorm.Model
	SenderID 	uint 	`gorm:"not null;index:idx_friend_request_pair,priority:1"`
	ReceiverID 	uint 	`gorm:"not null;index:idx_friend_request_pair,priority:2"`
	Status 		string 	`gorm:"size:20;default:pending;index"`
}

type Friend struct {
	gorm.Model
	UserID 		uint 	`gorm:"not null;uniqueIndex:idx_user_friend_pair,priority:1"`
	FriendID 	uint 	`gorm:"not null;uniqueIndex:idx_user_friend_pair,priority:2"`
}

type Block struct {
	gorm.Model
	UserID 		uint 	`gorm:"not null;uniqueIndex:idx_block_pair,priority:1"`
	BlockedID	uint 	`gorm:"not null;uniqueIndex:idx_block_pair,priority:2"`
}