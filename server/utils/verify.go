package utils

import (
	"errors"
	"os"

	"github.com/golang-jwt/jwt/v5"
)


func VerifyRefreshToken(tokenString string) (jwt.MapClaims,error) {
	token, err := jwt.Parse(tokenString,func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("Invalid signing method")
		}
		return []byte(os.Getenv("JWT_REFRESH_SECRET")), nil
	})

	if err != nil || !token.Valid {
		return nil , errors.New("Invalid Token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("Invalid claims")
	}
	return claims, nil

}

func VerifyAccessToken(tokenString string) (jwt.MapClaims,error) {
	token, err := jwt.Parse(tokenString,func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("Invalid signing method")
		}
		return []byte(os.Getenv("JWT_ACCESS_SECRET")), nil
	})

	if err != nil || !token.Valid {
		return nil , errors.New("Invalid Token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("Invalid claims")
	}
	return claims, nil

}