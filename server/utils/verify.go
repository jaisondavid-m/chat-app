package utils

import (
	"errors"

	"github.com/golang-jwt/jwt/v5"
)


func VerifyAccessToken(tokenString string) (jwt.MapClaims,error) {
	token, err := jwt.Parse(tokenString,func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("Invalid signing method")
		}
		return accessSecret, nil
	})

	if err != nil || !token.Valid {
		return nil , errors.New("Invalid Token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("Invalid claimn")
	}
	return claims, nil

}