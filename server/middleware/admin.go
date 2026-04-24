package middleware

import (
	"net/http"
	"server/config"
	"server/models"
	"server/utils"

	"github.com/gin-gonic/gin"
)

func Admin() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie("access_token")
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "Unauthorized",
			})
			c.Abort()
			return
		}

		claims, err := utils.VerifyAccessToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "Unauthorized",
			})
			c.Abort()
			return
		}

		email, ok := claims["email"].(string)
		if !ok || email == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "Unauthorized",
			})
			c.Abort()
			return
		}

		var user models.User
		if err := config.DB.Where("email = ?", email).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "User Not found",
			})
			c.Abort()
			return
		}

		if user.Role != "admin" && user.Role != "superadmin" {
			c.JSON(http.StatusForbidden, gin.H{
				"message": "Admin Access Only",
			})
			c.Abort()
			return
		}

		c.Set("user",user)

		c.Next()

	}
}

func GetTotalGroup(c *gin.Context) {

	var count int64

	if err := config.DB.Model(&models.Group{}).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to count groups",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_groups": count,
	})

}

func GetActiveGroupCount(c *gin.Context) {

	var count int64

	if err := config.DB.Model(&models.Group{}).Where("is_active =?", true).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Failed to count active group",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"active_groups": count,
	})

}
