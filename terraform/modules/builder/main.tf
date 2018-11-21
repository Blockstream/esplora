resource "google_compute_disk" "data" {
  name  = "builder-data-${var.name}-${count.index}"
  type  = "pd-ssd"
  zone  = "${element(var.zones, count.index)}"
  image = "${var.image}"
}

resource "google_compute_instance" "builder" {
  count                     = "${var.create_resources > 0 ? var.cluster_size : 0}"
  name                      = "builder-${var.name}-${count.index}"
  machine_type              = "${var.instance_type}"
  zone                      = "${element(var.zones, count.index)}"
  project                   = "${var.project}"
  allow_stopping_for_update = true

  labels {
    type    = "builder"
    name    = "${var.name}"
    network = "${var.network}"
  }

  service_account {
    scopes = [
      "https://www.googleapis.com/auth/compute",
      "https://www.googleapis.com/auth/devstorage.read_only",
    ]
  }

  boot_disk {
    auto_delete = true

    initialize_params {
      size  = "10"
      image = "${var.boot-image}"
      type  = "pd-ssd"
    }
  }

  attached_disk {
    source      = "${google_compute_disk.data.self_link}"
    device_name = "data"
  }

  network_interface {
    network = "${data.google_compute_network.default.self_link}"

    access_config {}
  }

  metadata {
    "user-data" = "${data.template_cloudinit_config.builder.rendered}"
  }
}
