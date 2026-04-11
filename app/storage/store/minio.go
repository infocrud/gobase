package store

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/rs/zerolog/log"
	"github.com/sureshkumarselvaraj/gobase/internal/config"
)

// MinIOStore wraps the MinIO client with high-level storage operations.
type MinIOStore struct {
	client          *minio.Client
	defaultBucket   string
	signedURLExpiry time.Duration
}

// ObjectInfo holds metadata about a stored object.
type ObjectInfo struct {
	Key          string    `json:"key"`
	Size         int64     `json:"size"`
	ContentType  string    `json:"content_type"`
	LastModified time.Time `json:"last_modified"`
	ETag         string    `json:"etag"`
}

// NewMinIOStore creates a new MinIO client and ensures the default bucket exists.
func NewMinIOStore(cfg config.MinIOConfig) (*MinIOStore, error) {
	client, err := minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.UseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create MinIO client: %w", err)
	}

	store := &MinIOStore{
		client:          client,
		defaultBucket:   cfg.Bucket,
		signedURLExpiry: cfg.SignedURLExpiry,
	}

	// Ensure default bucket exists
	if err := store.EnsureBucket(context.Background(), cfg.Bucket); err != nil {
		return nil, fmt.Errorf("failed to create default bucket: %w", err)
	}

	log.Info().
		Str("endpoint", cfg.Endpoint).
		Str("bucket", cfg.Bucket).
		Msg("MinIO connected")

	return store, nil
}

// EnsureBucket creates a bucket if it doesn't exist.
func (s *MinIOStore) EnsureBucket(ctx context.Context, bucket string) error {
	exists, err := s.client.BucketExists(ctx, bucket)
	if err != nil {
		return fmt.Errorf("failed to check bucket: %w", err)
	}
	if !exists {
		if err := s.client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{}); err != nil {
			return fmt.Errorf("failed to create bucket: %w", err)
		}
		log.Info().Str("bucket", bucket).Msg("Bucket created")
	}
	return nil
}

// Upload stores a file in the specified bucket.
func (s *MinIOStore) Upload(ctx context.Context, bucket, objectPath string, reader io.Reader, size int64, contentType string) (*ObjectInfo, error) {
	if bucket == "" {
		bucket = s.defaultBucket
	}

	info, err := s.client.PutObject(ctx, bucket, objectPath, reader, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to upload object: %w", err)
	}

	return &ObjectInfo{
		Key:  info.Key,
		Size: info.Size,
		ETag: info.ETag,
	}, nil
}

// Download retrieves a file from the specified bucket.
func (s *MinIOStore) Download(ctx context.Context, bucket, objectPath string) (*minio.Object, *minio.ObjectInfo, error) {
	if bucket == "" {
		bucket = s.defaultBucket
	}

	obj, err := s.client.GetObject(ctx, bucket, objectPath, minio.GetObjectOptions{})
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get object: %w", err)
	}

	stat, err := obj.Stat()
	if err != nil {
		obj.Close()
		return nil, nil, fmt.Errorf("failed to stat object: %w", err)
	}

	return obj, &stat, nil
}

// Delete removes a file from the specified bucket.
func (s *MinIOStore) Delete(ctx context.Context, bucket, objectPath string) error {
	if bucket == "" {
		bucket = s.defaultBucket
	}

	err := s.client.RemoveObject(ctx, bucket, objectPath, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete object: %w", err)
	}
	return nil
}

// List returns all objects in a bucket with the given prefix.
func (s *MinIOStore) List(ctx context.Context, bucket, prefix string) ([]ObjectInfo, error) {
	if bucket == "" {
		bucket = s.defaultBucket
	}

	var objects []ObjectInfo
	for obj := range s.client.ListObjects(ctx, bucket, minio.ListObjectsOptions{
		Prefix:    prefix,
		Recursive: true,
	}) {
		if obj.Err != nil {
			return nil, fmt.Errorf("failed to list objects: %w", obj.Err)
		}
		objects = append(objects, ObjectInfo{
			Key:          obj.Key,
			Size:         obj.Size,
			ContentType:  obj.ContentType,
			LastModified: obj.LastModified,
			ETag:         obj.ETag,
		})
	}

	return objects, nil
}

// PresignedGetURL generates a presigned download URL.
func (s *MinIOStore) PresignedGetURL(ctx context.Context, bucket, objectPath string, expiry time.Duration) (string, error) {
	if bucket == "" {
		bucket = s.defaultBucket
	}
	if expiry == 0 {
		expiry = s.signedURLExpiry
	}

	reqParams := make(url.Values)
	presignedURL, err := s.client.PresignedGetObject(ctx, bucket, objectPath, expiry, reqParams)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned GET URL: %w", err)
	}
	return presignedURL.String(), nil
}

// PresignedPutURL generates a presigned upload URL.
func (s *MinIOStore) PresignedPutURL(ctx context.Context, bucket, objectPath string, expiry time.Duration) (string, error) {
	if bucket == "" {
		bucket = s.defaultBucket
	}
	if expiry == 0 {
		expiry = s.signedURLExpiry
	}

	presignedURL, err := s.client.PresignedPutObject(ctx, bucket, objectPath, expiry)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned PUT URL: %w", err)
	}
	return presignedURL.String(), nil
}

// ListBuckets returns all buckets.
func (s *MinIOStore) ListBuckets(ctx context.Context) ([]minio.BucketInfo, error) {
	buckets, err := s.client.ListBuckets(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list buckets: %w", err)
	}
	return buckets, nil
}

// CreateBucket creates a new bucket.
func (s *MinIOStore) CreateBucket(ctx context.Context, name string) error {
	return s.EnsureBucket(ctx, name)
}

// DeleteBucket removes an empty bucket.
func (s *MinIOStore) DeleteBucket(ctx context.Context, name string) error {
	if err := s.client.RemoveBucket(ctx, name); err != nil {
		return fmt.Errorf("failed to delete bucket: %w", err)
	}
	return nil
}
