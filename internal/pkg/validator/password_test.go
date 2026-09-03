package validator

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestValidatePasswordStrength(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  error
	}{
		{
			name:     "Valid strong password",
			password: "ValidPassw0rd!@#",
			wantErr:  nil,
		},
		{
			name:     "Too short (< 8 chars)",
			password: "P@ss1",
			wantErr:  ErrPasswordTooShort,
		},
		{
			name:     "Missing uppercase",
			password: "validpassw0rd!@#",
			wantErr:  ErrPasswordNoUpper,
		},
		{
			name:     "Missing lowercase",
			password: "VALIDPASSW0RD!@#",
			wantErr:  ErrPasswordNoLower,
		},
		{
			name:     "Missing digit",
			password: "ValidPassword!@#",
			wantErr:  ErrPasswordNoDigit,
		},
		{
			name:     "Missing special character",
			password: "ValidPassw0rd123",
			wantErr:  ErrPasswordNoSymbol,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePasswordStrength(tt.password)
			if tt.wantErr != nil {
				assert.Equal(t, tt.wantErr, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
