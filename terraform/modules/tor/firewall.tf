resource "google_compute_firewall" "tor-healthcheck" {
  name    = "${var.name}-healthcheck"
  network = data.google_compute_network.default.self_link

  count = var.create_resources

  allow {
    protocol = "tcp"
    ports    = ["9050"]
  }

  source_ranges = ["130.211.0.0/22", "35.191.0.0/16", "10.0.0.0/8"]

  target_service_accounts = [
    google_service_account.tor[0].email,
  ]
}

resource "google_compute_firewall" "prom-traffic" {
  name    = "tor-${var.name}-prometheus-access"
  network = data.google_compute_network.default.self_link

  count = var.create_resources

  allow {
    protocol = "tcp"
    ports    = ["9100"]
  }

  source_service_accounts = [
    var.service_account_prom,
  ]

  target_service_accounts = [
    google_service_account.tor[0].email,
  ]
}
