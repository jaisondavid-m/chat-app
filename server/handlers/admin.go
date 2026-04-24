package handlers

import (
	"net/http"
	"server/config"
	"server/models"

	"github.com/gin-gonic/gin"
)

func GetAllUsers(c *gin.Context) {

	var users []models.User

	if err := config.DB.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError,gin.H{
			"message":"Failed to fetch users",
		})
		return
	}

	c.JSON(http.StatusOK,gin.H{
		"users":users,
	})

}

func GetAdminStats(c *gin.Context) {

	var users, activeUsers, groups, activeGroups int64

	config.DB.Model(&models.User{}).Count(&users)
	config.DB.Model(&models.User{}).Where("is_active = ?",true).Count(&activeUsers)
	config.DB.Model(&models.Group{}).Count(&groups)
	config.DB.Model(&models.Group{}).Where("is_active = ?",true).Count(&activeGroups)

	c.JSON(http.StatusOK,gin.H{
		"total_users":users,
		"active_users":activeUsers,
		"total_groups":groups,
		"active_groups":activeGroups,
	})

}