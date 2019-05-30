resource "google_compute_firewall" "all-traffic" {
  name    = "prometheus-${var.name}-all-traffic-access"
  network = data.google_compute_network.default.self_link

  count = var.create_resources

  allow {
    protocol = "tcp"
    ports    = ["80"]
  }

  source_ranges = ["${var.allowed_source_ip}/32"]

  target_service_accounts = [
    google_service_account.prometheus[0].email,
  ]
}
