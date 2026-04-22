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
		&models.Block{},
		&models.LockedChat{},
	)

	if err != nil {
		log.Fatal("Migration Failed:", err)
	}

	// Remove legacy index that incorrectly enforced unique FriendID globally.
	if DB.Migrator().HasIndex(&models.LockedChat{}, "idx_locked_chat_pair") {
		if err := DB.Migrator().DropIndex(&models.LockedChat{}, "idx_locked_chat_pair"); err != nil {
			log.Fatal("Failed to drop legacy locked chat index:", err)
		}
	}

	log.Println("Migration Completed Successfully")

}
