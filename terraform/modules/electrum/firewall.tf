resource "google_compute_firewall" "all-traffic" {
  name    = "electrum-${var.name}-all-traffic-access"
  network = data.google_compute_network.default.self_link

  count = var.create_resources

  allow {
    protocol = "tcp"
    ports    = ["50001", "50002", "50401", "50402", "60001", "60002", "80"]
  }

  source_ranges = ["0.0.0.0/0"]

  target_service_accounts = [
    google_service_account.electrum[0].email,
  ]
}
