package cloudinary

import (
	"context"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

type CloudinaryService interface {
	UploadImage(ctx context.Context, file interface{}, folder string) (string, error)
}

type cloudinaryService struct {
	cld *cloudinary.Cloudinary
}

func NewCloudinaryService(url string) (CloudinaryService, error) {
	cld, err := cloudinary.NewFromURL(url)
	if err != nil {
		return nil, err
	}
	return &cloudinaryService{cld: cld}, nil
}

func (s *cloudinaryService) UploadImage(ctx context.Context, file interface{}, folder string) (string, error) {
	resp, err := s.cld.Upload.Upload(ctx, file, uploader.UploadParams{Folder: folder})
	if err != nil {
		return "", err
	}

	return resp.SecureURL, nil
}
