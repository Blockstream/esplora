resource "google_compute_firewall" "all-traffic" {
  name    = "prometheus-${var.name}-all-traffic-access"
  network = data.google_compute_network.default.self_link

  allow {
    protocol = "tcp"
    ports    = ["80"]
  }

  source_ranges = var.allowed_source_ip

  target_service_accounts = [
    google_service_account.prometheus.email,
  ]

  lifecycle {
    ignore_changes = [source_ranges]
  }
}
