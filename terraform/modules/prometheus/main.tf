resource "google_compute_disk" "prometheus-data" {
  count   = var.instances
  name    = "prometheus-${var.name}-data-disk-${count.index}"
  project = var.project
  type    = "pd-standard"
  zone    = var.zone
  size    = var.size
}

resource "google_compute_address" "prometheus-address" {
  count   = var.instances
  name    = "prometheus-${var.name}-address-${count.index}"
  project = var.project
  region  = var.region
}

resource "google_compute_address" "prometheus-internal-address" {
  count        = var.instances
  name         = "prometheus-${var.name}-internal-address-${count.index}"
  project      = var.project
  region       = var.region
  address_type = "INTERNAL"
}

resource "google_compute_instance" "prometheus-server" {
  count                     = var.instances
  name                      = "prometheus-${var.name}-${count.index}"
  machine_type              = var.machine_type
  zone                      = var.zone
  project                   = var.project
  allow_stopping_for_update = true

  labels = {
    type    = "prometheus"
    name    = var.name
    network = var.network
  }

  service_account {
    email = google_service_account.prometheus.email

    scopes = [
      "compute-rw",
      "storage-ro",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring.write",
    ]
  }

  boot_disk {
    initialize_params {
      size  = "20"
      image = var.image
    }
  }

  attached_disk {
    source      = google_compute_disk.prometheus-data[count.index].name
    device_name = "data"
  }

  network_interface {
    network    = data.google_compute_network.default.self_link
    network_ip = google_compute_address.prometheus-internal-address[count.index].address

    access_config {
      nat_ip = google_compute_address.prometheus-address[count.index].address
    }
  }

  metadata = {
    user-data = data.template_cloudinit_config.prometheus.rendered
  }
}
