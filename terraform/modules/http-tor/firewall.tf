resource "google_compute_firewall" "all-traffic" {
  name    = "http-${var.name}-all-traffic-access"
  network = data.google_compute_network.default.self_link

  count = var.create_resources

  allow {
    protocol = "tcp"
    ports    = ["80"]
  }

  source_ranges = ["0.0.0.0/0"]

  target_service_accounts = [
    google_service_account.http[0].email,
  ]
}

resource "google_compute_firewall" "prom-traffic" {
  name    = "http-${var.name}-prometheus-access"
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
    google_service_account.http[0].email,
  ]
}
