package models

import "gorm.io/gorm"

type User struct {
	gorm.Model

	GoogleID 	string 		`gorm:"size:255;uniqueIndex;not null"`
	Name     	string 		`gorm:"size:120;not null"`
	Email    	string 		`gorm:"size:255;uniqueIndex;not null"`
	Avatar   	string 		`gorm:"type:text"`
	Role     	string 		`gorm:"size:20;default:user"`
	IsActive 	bool   		`gorm:"default:true"`
}