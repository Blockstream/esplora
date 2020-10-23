resource "google_compute_disk" "electrum-data" {
  count   = var.create_resources > 0 ? var.instances : 0
  name    = "electrum-${var.name}-data-disk-${count.index}"
  project = var.project
  type    = "pd-standard"
  zone    = var.zones[count.index]
  size    = var.size
  image   = var.image
}

resource "google_compute_address" "electrum-address" {
  count   = var.create_resources > 0 ? var.instances : 0
  name    = "electrum-${var.name}-address-${count.index}"
  project = var.project
  region  = var.region
}

resource "google_compute_address" "electrum-internal-address" {
  count        = var.create_resources > 0 ? var.instances : 0
  name         = "electrum-${var.name}-internal-address-${count.index}"
  project      = var.project
  region       = var.region
  address_type = "INTERNAL"
}

locals {
  service_account = terraform.workspace == "main" ? element(concat(google_service_account.electrum.*.email, list("")), 0) : var.electrum_service_account
}

resource "google_compute_instance" "electrum-server" {
  count                     = var.create_resources > 0 ? var.instances : 0
  name                      = "electrum-${var.name}-${count.index}"
  machine_type              = var.machine_type
  zone                      = var.zones[count.index]
  project                   = var.project
  allow_stopping_for_update = true

  labels = {
    type    = "electrum"
    name    = var.name
    network = var.network
  }

  service_account {
    email = local.service_account

    scopes = [
      "https://www.googleapis.com/auth/compute.readonly",
      "https://www.googleapis.com/auth/devstorage.read_only",
    ]
  }

  boot_disk {
    auto_delete = false
    source      = google_compute_disk.electrum-data[count.index].name
  }

  network_interface {
    network    = data.google_compute_network.default.self_link
    network_ip = google_compute_address.electrum-internal-address[count.index].address

    access_config {
      nat_ip = google_compute_address.electrum-address[count.index].address
    }
  }

  metadata = {
    user-data = data.template_cloudinit_config.electrum.rendered
  }
}
