package utils

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
)

type RecaptchaResponse struct {
	Success 		bool 			`json:"success"`
	Score 			float64			`json:"score"`
	Action 			string 			`json:"action"`
	ChallengeTS 	string 			`json:"challenge_ts"`
	Hostname 		string 			`json:"hostname"`
	ErrorCodes 		[]string 		`json:"error-codes"`
}

func VerifyRecaptcha(token string) error {

	secret := os.Getenv("RECAPTCHA_SECRET_KEY")

	resp, err := http.PostForm("https://www.google.com/recaptcha/api/siteverify",
		url.Values{
			"secret": {secret},
			"response": {token},
		},
	)

	if err != nil {
		return fmt.Errorf("recaptcha request failed: %w",err)
	}

	defer resp.Body.Close()

	var result RecaptchaResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return fmt.Errorf("recaptcha decode failed: %w",err)
	}

	if !result.Success {
		return errors.New("recaptcha verfication failed")
	}

	if result.Score < 0.5 {
		return fmt.Errorf("bot detected: score %.2f",result.Score)
	}

	if result.Action != "login" {
		return errors.New("recaptcha action mismatch")
	}

	return nil

}