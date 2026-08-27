package service

import (
	"testing"

	"github.com/sandi/lumiina/internal/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// 1. Ini adalah wujud Stuntman kita (Dapur Palsu)
type MockUserRepository struct {
	mock.Mock // Kostum stuntman bawaan dari testify
}

// 2. Kita ajari Stuntman cara meniru fungsi CreateUser yang asli
func (m *MockUserRepository) CreateUser(user *model.User) error {
	// m.Called merekam aksi. Nanti kita bisa nyuruh Stuntman:
	// "Eh, pura-puralah sukses (return nil) atau pura-pura error ya!"
	args := m.Called(user)
	return args.Error(0)
}

// 3. Kita ajari Stuntman meniru fungsi FindByIdentifier
// (Fungsi ini wajib ada biar Stuntman 100% mirip dengan Dapur asli)
func (m *MockUserRepository) FindByIdentifier(identifier string) (*model.User, error) {
	args := m.Called(identifier)
	if args.Get(0) != nil {
		return args.Get(0).(*model.User), args.Error(1)
	}
	return nil, args.Error(1)
}

func TestRegister_Success(t *testing.T) {
	// ----------------------------------------------------
	// 1. ARRANGE (Persiapan Lokasi Syuting)
	// ----------------------------------------------------

	// Panggil Stuntman ke lokasi syuting
	mockRepo := new(MockUserRepository)

	// Suntikkan Stuntman ke dalam Koki (Service), menggantikan Database Asli!
	userService := NewUserService(mockRepo)

	// Siapkan aktor utama (Data dummy/bohongan)
	dummyUser := &model.User{
		Username: "sandi",
		Email:    "sandi@htb.com",
		Password: "passwordrahasia",
	}

	// Beri naskah skenario ke Stuntman:
	// "Eh, nanti kalau Koki nyuruh kamu nyimpan data (CreateUser) dengan data apa saja (mock.Anything),
	// pura-puralah berhasil tanpa error ya (Return nil)!"
	mockRepo.On("CreateUser", mock.Anything).Return(nil)

	// ----------------------------------------------------
	// 2. ACT (Aksi! Action!)
	// ----------------------------------------------------

	// Kita suruh Koki menjalankan tugas aslinya dengan data dummy
	err := userService.Register(dummyUser)

	// ----------------------------------------------------
	// 3. ASSERT (Penilaian oleh Robot Tester / Inspektur)
	// ----------------------------------------------------

	// Inspektur mengecek: Harusnya tidak ada error (karena stuntman disuruh sukses)
	assert.NoError(t, err)

	// Inspektur mengecek fitur Keamanan Siber:
	// Password tidak boleh lagi "passwordrahasia" (harus sudah di-hashing oleh Koki)
	assert.NotEqual(t, "passwordrahasia", dummyUser.Password)
	assert.NotEmpty(t, dummyUser.Password) // Tidak boleh kosong

	// Inspektur mengecek aturan bisnis:
	// Karena Sandi tidak ngasih role, harusnya otomatis dikasih role "regular" oleh Koki
	assert.Equal(t, "regular", dummyUser.Role)

	// Terakhir, pastikan Stuntman benar-benar melakukan adegannya (fungsi CreateUser benar dipanggil)
	mockRepo.AssertExpectations(t)
}
