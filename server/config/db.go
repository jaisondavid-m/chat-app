package config

import (
	"crypto/tls"
	"crypto/x509"
	"log"
	"os"
	"time"
	"strings"

	"github.com/joho/godotenv"
	mysqlDriver "github.com/go-sql-driver/mysql"
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

func TiDBconnect() {

	err := godotenv.Load()

	if err != nil {
		log.Println("No env file found")
	}

	dsn := os.Getenv("DB_DSN")

	if dsn == "" {
		log.Fatal("DB_DSN is not set")
	}

	cert := os.Getenv("DB_CERT")
	if cert == "" {
		log.Fatal("DB_CERT is not set")
	}

	cert = strings.ReplaceAll(cert, `\n`,"\n")

	rootCertPool := x509.NewCertPool()

	if ok := rootCertPool.AppendCertsFromPEM([]byte(cert)); !ok {
		log.Fatal("Failed to append CA cert")
	}

	tlsConfig := &tls.Config{
		RootCAs: rootCertPool,
		MinVersion: tls.VersionTLS12,
	}

	err = mysqlDriver.RegisterTLSConfig("custom",tlsConfig)

	if err != nil {
		log.Fatal(err)
	}

	for i := 1; i<= 5; i++ {
		// DB, err := gorm.Open(mysql.New(dsn),&gorm.Config{
		// 	PrepareStmt: true,
		// })
		DB, err = gorm.Open(mysql.New(mysql.Config{
			DSN: dsn,
		}), &gorm.Config{
			PrepareStmt: true,
		})
		if err == nil {
			log.Println("DB Connected on attempt",i)
			break
		}
		log.Println("Retrying DB connection...",i)
		time.Sleep(3 * time.Second)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatal("DB ping failed",err)
	}

	sqlDB.SetMaxOpenConns(10)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(30*time.Minute)
	sqlDB.SetConnMaxIdleTime(10*time.Minute)

	log.Print("DB Connected Successfully")

}