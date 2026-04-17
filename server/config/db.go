package config

import (

	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

)

var DB *gorm.DB

func Connect() {

	err := godotenv.Load()
	if err != nil {
		log.Println("No env file found")
	}

	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		log.Fatal("DB_DSN is not set")
	}

	for i := 1; i<= 5; i++ {
		DB, err = gorm.Open(mysql.Open(dsn),&gorm.Config{
			PrepareStmt: true,
		})
		if err == nil {
			break
		}
		log.Println("Retrying DB Connection...",i)
		time.Sleep(3*time.Second)
	}

	if err != nil {
		log.Fatal("Failed to connect DB:",err)
	}

	sqlDB , err := DB.DB()
	if err != nil {
		log.Fatal("Failed to get DB instance",err)
	}

	err = sqlDB.Ping()
	if err != nil {
		log.Fatal("DB ping failed",err)
	}

	sqlDB.SetMaxOpenConns(10)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(30*time.Minute)
	sqlDB.SetConnMaxIdleTime(10*time.Minute)

	log.Println("MySQL connected Successfully")

}