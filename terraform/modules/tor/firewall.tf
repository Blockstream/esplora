resource "google_compute_firewall" "tor-healthcheck" {
  name    = "${var.name}-healthcheck"
  network = "${data.google_compute_network.default.self_link}"

  count = "${var.create_resources}"

  allow {
    protocol = "tcp"
    ports    = ["9050"]
  }

  source_ranges = ["130.211.0.0/22", "35.191.0.0/16", "10.0.0.0/8"]

  target_service_accounts = [
    "${google_service_account.tor.email}",
  ]
}
