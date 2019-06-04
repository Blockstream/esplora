resource "google_compute_region_autoscaler" "http" {
  name   = "http-${var.name}-explorer-ig-${var.regions[count.index]}"
  region = var.regions[count.index]
  target = google_compute_region_instance_group_manager.http[count.index].self_link

  count = var.create_resources > 0 ? length(var.regions) : 0

  autoscaling_policy {
    max_replicas    = "2"
    min_replicas    = "1"
    cooldown_period = 60

    cpu_utilization {
      target = 0.7
    }
  }
}

resource "google_compute_region_instance_group_manager" "http" {
  provider           = "google-beta"
  name               = "http-${var.name}-explorer-ig-${var.regions[count.index]}"
  base_instance_name = "http-${var.name}-explorer-ig-${var.regions[count.index]}"

  version {
    instance_template = google_compute_instance_template.http[0].self_link
    name              = "original"
  }

  region = var.regions[count.index]

  named_port {
    name = "http"
    port = 80
  }

  count = var.create_resources > 0 ? length(var.regions) : 0

  auto_healing_policies {
    health_check      = google_compute_health_check.http[0].self_link
    initial_delay_sec = 300
  }

  update_policy {
    type                  = "PROACTIVE"
    minimal_action        = "REPLACE"
    max_surge_fixed       = 3
    max_unavailable_fixed = 0
    min_ready_sec         = 60
  }
}

resource "google_compute_instance_template" "http" {
  name_prefix  = "http-${var.name}-explorer-ig-"
  description  = "This template is used to create ${var.name} http redirect instances."
  tags         = ["http", "http-${var.name}"]
  machine_type = "f1-micro"

  count = var.create_resources

  labels = {
    type    = "http-tor"
    name    = var.name
    network = var.network
  }

  disk {
    source_image = var.boot-image
    auto_delete  = true
    boot         = true
    disk_type    = "pd-standard"
  }

  scheduling {
    automatic_restart   = true
    on_host_maintenance = "MIGRATE"
  }

  network_interface {
    network = data.google_compute_network.default.self_link

    access_config {}
  }

  metadata = {
    user-data = data.template_cloudinit_config.http.rendered
  }

  service_account {
    email  = google_service_account.http[0].email
    scopes = ["compute-ro", "storage-ro", "https://www.googleapis.com/auth/logging.write"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_compute_health_check" "http" {
  name                = "http-${var.name}-explorer-health-check"
  timeout_sec         = 3
  check_interval_sec  = 10
  unhealthy_threshold = 3

  count = var.create_resources

  http_health_check {
    port         = 80
    request_path = "/lbtest"
  }
}
