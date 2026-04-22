package models

import "gorm.io/gorm"

type LockedChat struct {
	gorm.Model
	UserID   uint   `gorm:"not null;uniqueIndex:idx_locked_chat_user_friend,priority:1"`
	FriendID uint   `gorm:"not null;uniqueIndex:idx_locked_chat_user_friend,priority:2"`
	PinHash  string `gorm:"not null"`
}
