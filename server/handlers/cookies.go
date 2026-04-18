package handlers

import (

	"github.com/gin-gonic/gin"
)

func setAuthCookie( c*gin.Context, name, value string,maxAge int) {
	c.SetCookie(
		name,
		value,
		maxAge,
		"/",
		"",
		false,
		true,
	)
}

func ClearAuthCookie(c *gin.Context, name string) {
	c.SetCookie(
		name,
		"",
		-1,
		"/",
		"",
		false,
		true,
	)
}