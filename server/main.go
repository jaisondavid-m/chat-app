package main

import (
	"log"
	"server/config"
)

func main() {

	config.Connect()
	log.Println("Server Running")
}