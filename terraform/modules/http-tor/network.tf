resource "google_compute_backend_service" "http" {
  name        = "${var.name}-http-to-https-backend"
  port_name   = "http"
  protocol    = "HTTP"
  timeout_sec = 10
  enable_cdn  = true

  backend       = ["${data.customconfig_google_backend.customconfig.backends}"]
  health_checks = ["${google_compute_http_health_check.http.self_link}"]

  count = "${var.create_resources}"
}

resource "google_compute_http_health_check" "http" {
  name = "http-${var.name}-health"

  timeout_sec         = 3
  check_interval_sec  = 10
  unhealthy_threshold = 3

  port         = "80"
  request_path = "/lbtest"

  count = "${var.create_resources}"
}
