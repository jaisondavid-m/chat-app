package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

func setAuthCookie( c*gin.Context, name, value string,maxAge int) {
	c.SetCookie(
		name,
		value,
		maxAge,
		"/",
		"",
		true,
		true,
	)
	// c.Writer.Header().Add("Set-Cookie",
	// name+"="+value+
	// 	"; Path=/; Max-Age="+strconv.Itoa(maxAge)+
	// 	"; Domain=chat-app-eta-nine-93.vercel.app"+
	// 	"; Secure; HttpOnly; SameSite=None")
}

func ClearAuthCookie(c *gin.Context, name string) {
	c.SetCookie(
		name,
		"",
		-1,
		"/",
		"",
		true,
		true,
	)
	// c.Writer.Header().Add("Set-Cookie",
	// 	name+"="+
	// 		"; Path=/; Max-Age=-1"+
	// 		"; Domain=chat-app-eta-nine-93.vercel.app"+
	// 		"; Secure; HttpOnly; SameSite=None")
}