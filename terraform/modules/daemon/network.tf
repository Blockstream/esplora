# Health check
resource "google_compute_http_health_check" "daemon" {
  name         = "${var.name}-explorer-http-health-check"
  request_path = "${var.name == "bitcoin-mainnet" ? "/api/tip/hash" : var.name == "bitcoin-testnet" ? "/testnet/api/tip/hash" : "/liquid/api/tip/hash"}"

  timeout_sec        = 5
  check_interval_sec = 5

  count = "${var.create_resources}"
}

# Backend service
resource "google_compute_backend_service" "daemon" {
  name        = "${var.name}-explorer-backend-service"
  protocol    = "HTTP"
  port_name   = "http"
  timeout_sec = 30
  enable_cdn  = true

  backend       = ["${data.customconfig_google_backend.customconfig.backends}"]
  health_checks = ["${google_compute_http_health_check.daemon.self_link}"]

  count = "${var.create_resources}"
}
