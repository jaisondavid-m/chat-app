package config

import (
	"log"
	"server/models"
)

func Migrate() {

	err := DB.AutoMigrate(
		&models.User{},
		&models.Message{},
		&models.FriendRequest{},
		&models.Friend{},
	)

	if err != nil {
		log.Fatal("Migration Failed:",err)
	}

	log.Println("Migration Completed Successfully")

}