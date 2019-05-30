resource "google_compute_firewall" "http-healthcheck" {
  name    = "${var.name}-healthcheck-access"
  network = data.google_compute_network.default.self_link

  count = var.create_resources

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["130.211.0.0/22", "35.191.0.0/16", "10.0.0.0/8"]

  target_service_accounts = [
    google_service_account.daemon[0].email,
  ]
}

resource "google_compute_firewall" "all-traffic" {
  name    = "${var.name}-all-traffic-access"
  network = data.google_compute_network.default.self_link

  count = var.create_resources

  allow {
    protocol = "tcp"
    ports    = ["443"]
  }

  source_ranges = ["0.0.0.0/0"]

  target_service_accounts = [
    google_service_account.daemon[0].email,
  ]
}

resource "google_compute_firewall" "prom-traffic" {
  name    = "daemon-${var.name}-prometheus-access"
  network = data.google_compute_network.default.self_link

  count = var.create_resources

  allow {
    protocol = "tcp"
    ports    = ["4224", "9100"]
  }

  source_service_accounts = [
    var.service_account_prom,
  ]

  target_service_accounts = [
    google_service_account.daemon[0].email,
  ]
}
