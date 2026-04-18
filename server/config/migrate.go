package config

import (
	"log"
	"server/models"
)

func Migrate() {

	err := DB.AutoMigrate(
		&models.User{},
	)

	if err != nil {
		log.Fatal("Migration Failed:",err)
	}

	log.Println("Migration Completed Successfully")

}