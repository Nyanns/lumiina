package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/sandi/lumiina/internal/model"
	"github.com/sandi/lumiina/internal/service"
)

type UserHandler struct {
	service   service.UserService
	jwtSecret string
}

func NewUserHandler(service service.UserService, jwtSecret string) *UserHandler {
	return &UserHandler{service: service, jwtSecret: jwtSecret}
}

// Register handles new user registration and dispatches email verification.
// @Summary Register a new user
// @Description Creates a new user account and returns a verification token.
// @Tags auth
// @Accept json
// @Produce json
// @Param req body model.RegisterRequest true "User Registration Data"
// @Success 201 {object} map[string]interface{}
// @Router /auth/register [post]
func (h *UserHandler) Register(c *gin.Context) {
	var req model.RegisterRequest

	err := c.ShouldBindJSON(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Password != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Konfirmasi password tidak cocok dengan password yang dimasukkan"})
		return
	}

	user := model.User{
		Username: req.Username,
		Email:    req.Email,
		Password: req.Password,
	}

	err = h.service.Register(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Registrasi berhasil! Tautan verifikasi telah dikirimkan ke email Anda.",
		"data":    user,
	})
}

func (h *UserHandler) Login(c *gin.Context) {
	var loginRequest model.LoginRequest

	err := c.ShouldBindJSON(&loginRequest)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error()})
		return
	}

	user, err := h.service.Login(loginRequest.Identifier, loginRequest.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	secret := h.jwtSecret

	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   tokenString,
	})
}

func (h *UserHandler) VerifyEmail(c *gin.Context) {
	token := c.Query("token")
	wantsJSON := c.GetHeader("Accept") == "application/json"

	if token == "" {
		if wantsJSON {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Token verifikasi wajib disertakan"})
			return
		}
		c.Data(http.StatusBadRequest, "text/html; charset=utf-8", []byte(renderVerificationErrorPage("Token Tidak Ditemukan", "Tautan verifikasi tidak lengkap atau tidak memiliki parameter token yang valid.")))
		return
	}

	err := h.service.VerifyEmail(token)
	if err != nil {
		if wantsJSON {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.Data(http.StatusBadRequest, "text/html; charset=utf-8", []byte(renderVerificationErrorPage("Tautan Kedaluwarsa / Tidak Valid", err.Error())))
		return
	}

	if wantsJSON {
		c.JSON(http.StatusOK, gin.H{
			"message": "Email berhasil diverifikasi! Akun Anda kini sudah aktif. Silakan login.",
		})
		return
	}

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(renderVerificationSuccessPage()))
}

func (h *UserHandler) ForgotPassword(c *gin.Context) {
	var req model.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.service.ForgotPassword(req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses permintaan reset password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Jika alamat email terdaftar di sistem kami, instruksi reset kata sandi telah dikirimkan ke email Anda.",
	})
}

func (h *UserHandler) ResetPassword(c *gin.Context) {
	var req model.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.NewPassword != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Konfirmasi password baru tidak cocok"})
		return
	}

	err := h.service.ResetPassword(req.Token, req.NewPassword)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Kata sandi berhasil diperbarui! Silakan login menggunakan kata sandi baru Anda.",
	})
}
