package models

type GoogleLoginRequest struct {
	Token string `json:"token" binding:"required"`
}