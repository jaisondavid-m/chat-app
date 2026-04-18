package utils

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// var accessSecret  = []byte(os.Getenv("JWT_ACCESS_SECRET"))
// var refreshSecret = []byte(os.Getenv("JWT_REFRESH_SECRET"))

func GenerateAccessToken( name , email , avatar string ) (string, error) {

	claims := jwt.MapClaims{
		"name"	: name,
		"email"	: email,
		"avatar": avatar,
		"type"	: "access",
		"exp"	: time.Now().Add(24*time.Hour).Unix(),
		"iat"	: time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256,claims)

	return token.SignedString([]byte(os.Getenv("JWT_ACCESS_SECRET")))

}

func GeneraeteRefreshToken(email string) (string , error) {

	claims := jwt.MapClaims{
		"email":email,
		"type":"refresh",
		"exp":time.Now().Add(60*24*time.Hour).Unix(),
		"iat": time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256,claims)
	
	return token.SignedString([]byte(os.Getenv("JWT_REFRESH_SECRET")))

}