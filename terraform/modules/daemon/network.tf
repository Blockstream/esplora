# Health check
resource "google_compute_http_health_check" "daemon" {
  name         = "${var.name}-explorer-http-health-check"
  request_path = var.name == "bitcoin-mainnet" ? "/api/blocks/tip/hash" : var.name == "bitcoin-testnet" ? "/testnet/api/blocks/tip/hash" : "/liquid/api/blocks/tip/hash"

  timeout_sec        = 20
  check_interval_sec = 30

  count = var.create_resources
}

# Backend service
resource "google_compute_backend_service" "daemon" {
  name        = "${var.name}-explorer-backend-service"
  protocol    = "HTTP"
  port_name   = "http"
  timeout_sec = 30
  enable_cdn  = true

  dynamic "backend" {
    for_each = google_compute_region_instance_group_manager.daemon
    iterator = group
    content {
      group = group.value.instance_group
    }
  }

  dynamic "backend" {
    for_each = google_compute_region_instance_group_manager.preemptible-daemon
    iterator = group
    content {
      group = group.value.instance_group
    }
  }

  health_checks = [google_compute_http_health_check.daemon[0].self_link]

  count = var.create_resources
}
