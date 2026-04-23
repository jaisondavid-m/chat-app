package models

type GoogleLoginRequest struct {
	Token 			string 		`json:"token" binding:"required"`
	// RecaptchaToken 	string 		`json:"recaptcha_token" binding:"required"`
}