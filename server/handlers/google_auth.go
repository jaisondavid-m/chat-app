package handlers

import (
	"context"
	"net/http"
	"os"

	"server/config"
	"server/models"
	"server/utils"

	"github.com/gin-gonic/gin"
	"google.golang.org/api/idtoken"
)

var GoogleClientID = os.Getenv("GOOGLE_CLIENT_ID")

func GoogleLogin(c *gin.Context) {

	var req models.GoogleLoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest,gin.H{
			"message":"Invalid Google Token",
		})
		return
	}

	payload, err := idtoken.Validate(context.Background(),req.Token,GoogleClientID)
	if err != nil {
		c.JSON(http.StatusUnauthorized,gin.H{
			"message":"Invalid Google Token",
		})
		return
	}

	googleID, _ := payload.Claims["sub"].(string)
	name, _ := payload.Claims["name"].(string)
	email, _ := payload.Claims["email"].(string)
	picture, _ := payload.Claims["picture"].(string)

	var user models.User

	err = config.DB.Where("email = ?",email).First(&user).Error

	if err != nil {
		user = models.User{
			GoogleID: googleID,
			Name: name,
			Email: email,
			Avatar: picture,
			Role: "user",
			IsActive: true,
		}
		if err := config.DB.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError,gin.H{
				"message":"Failed to Create User",
			})
			return
		}
	} else {
		user.Name = name
		user.Avatar = picture
		user.GoogleID = googleID
		config.DB.Save(&user)
	}

	accessToken, _ := utils.GenerateAccessToken(user.Name,user.Email,user.Avatar)
	refreshToken, _ := utils.GeneraeteRefreshToken(user.Email)

	setAuthCookie(c, "refresh_token",refreshToken,60*60*24*60)
	setAuthCookie(c, "access_token",accessToken, 60*60*24)

	c.JSON(http.StatusOK, gin.H{
		"message": "Login Success",
		"user":user,
	})
}

func Logout(c *gin.Context) {

	ClearAuthCookie(c,"access_token")
	ClearAuthCookie(c, "refresh_token")

	c.JSON(http.StatusOK,gin.H{
		"message":"Logged Out SuccessFully",
	})
}