package middleware

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	// httpRequestsTotal counts HTTP requests by method, path, and status.
	httpRequestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "gobase",
		Name:      "http_requests_total",
		Help:      "Total number of HTTP requests.",
	}, []string{"method", "path", "status"})

	// httpRequestDuration observes request latency in seconds.
	httpRequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "gobase",
		Name:      "http_request_duration_seconds",
		Help:      "HTTP request latency in seconds.",
		Buckets:   []float64{0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10},
	}, []string{"method", "path"})

	// httpActiveRequests tracks the number of in-flight requests.
	httpActiveRequests = promauto.NewGauge(prometheus.GaugeOpts{
		Namespace: "gobase",
		Name:      "http_active_requests",
		Help:      "Number of active HTTP requests being processed.",
	})

	// httpResponseSize observes response sizes in bytes.
	httpResponseSize = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "gobase",
		Name:      "http_response_size_bytes",
		Help:      "HTTP response size in bytes.",
		Buckets:   prometheus.ExponentialBuckets(100, 10, 7), // 100B to 100MB
	}, []string{"method", "path"})
)

// Metrics returns a Fiber middleware that records Prometheus metrics.
func Metrics() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		method := c.Method()
		path := normalizePath(c.Route().Path)

		httpActiveRequests.Inc()
		defer httpActiveRequests.Dec()

		err := c.Next()

		status := strconv.Itoa(c.Response().StatusCode())
		duration := time.Since(start).Seconds()
		size := float64(len(c.Response().Body()))

		httpRequestsTotal.WithLabelValues(method, path, status).Inc()
		httpRequestDuration.WithLabelValues(method, path).Observe(duration)
		httpResponseSize.WithLabelValues(method, path).Observe(size)

		return err
	}
}

// normalizePath reduces path cardinality by replacing dynamic segments with placeholders.
func normalizePath(path string) string {
	if path == "" {
		return "/"
	}
	return path
}
