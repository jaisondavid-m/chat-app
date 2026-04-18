package main

import (
	"log"

	"server/config"
	"server/routes"
	"server/middleware"

	"github.com/gin-gonic/gin"
)

func main() {

	config.Connect()
	config.Migrate()

	r := gin.Default()

	r.Use(middleware.CorsConfig())

	routes.RegisterRoutes(r)

	log.Println("Server Running")
	r.Run(":8000")
}