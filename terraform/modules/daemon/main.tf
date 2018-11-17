# Instance health check
resource "google_compute_health_check" "daemon" {
  name                = "${var.name}-explorer-health-check"
  timeout_sec         = 5
  check_interval_sec  = 10
  unhealthy_threshold = 3

  count = "${var.create_resources}"

  http_health_check {
    port         = 80
    request_path = "${var.name == "bitcoin-mainnet" ? "/api/tip/hash" : var.name == "bitcoin-testnet" ? "/testnet/api/tip/hash" : "/liquid/api/tip/hash"}"
  }
}

# Create regional instance group
resource "google_compute_region_instance_group_manager" "daemon" {
  name  = "${var.name}-explorer-ig-${element(var.regions, count.index)}"
  count = "${var.create_resources > 0 ? length(var.regions) : 0}"

  base_instance_name = "${var.name}-explorer-${element(var.regions, count.index)}-${count.index}"
  instance_template  = "${google_compute_instance_template.daemon.self_link}"
  region             = "${element(var.regions, count.index)}"
  target_size        = "${var.size}"

  update_strategy = "ROLLING_UPDATE"

  rolling_update_policy {
    type                  = "PROACTIVE"
    minimal_action        = "REPLACE"
    max_surge_fixed       = 3
    max_unavailable_fixed = 0
    min_ready_sec         = "${var.min_ready_sec}"
  }

  auto_healing_policies {
    health_check      = "${google_compute_health_check.daemon.self_link}"
    initial_delay_sec = "${var.initial_delay_sec}"
  }
}

## Create instance template
resource "google_compute_instance_template" "daemon" {
  name_prefix  = "${var.name}-explorer-template-"
  description  = "This template is used to create ${var.name} instances."
  machine_type = "${var.instance_type}"
  count        = "${var.create_resources}"

  labels {
    type    = "explorer"
    name    = "${var.name}"
    network = "${var.network}"
  }

  scheduling {
    automatic_restart   = true
    on_host_maintenance = "MIGRATE"
  }

  disk {
    source_image = "${var.boot-image}"
    disk_type    = "pd-ssd"
    auto_delete  = true
    boot         = true
  }

  disk {
    source_image = "${var.image}"
    disk_type    = "pd-ssd"
    auto_delete  = true
    device_name  = "data"
  }

  network_interface {
    network = "${data.google_compute_network.default.self_link}"

    access_config {}
  }

  metadata {
    google-logging-enabled = "true"
    "user-data"            = "${data.template_cloudinit_config.daemon.rendered}"
  }

  service_account {
    email  = "${google_service_account.daemon.email}"
    scopes = ["compute-ro", "storage-ro"]
  }

  lifecycle {
    create_before_destroy = true
  }
}
