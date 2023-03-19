# Instance health check
resource "google_compute_health_check" "daemon" {
  name                = "${var.name}-explorer-health-check"
  timeout_sec         = 30
  check_interval_sec  = 60
  unhealthy_threshold = 5

  count = var.create_resources

  http_health_check {
    port = 80
    request_path = (
      var.name == "bitcoin-mainnet" ? "/api/blocks/tip/hash"
      : var.name == "bitcoin-testnet" ? "/testnet/api/blocks/tip/hash"
      : var.name == "liquid-testnet" ? "/liquidtestnet/api/blocks/tip/hash"
    : "/liquid/api/blocks/tip/hash")
  }
}

# Create regional instance group
resource "google_compute_region_instance_group_manager" "daemon" {
  provider = google-beta
  name     = "${var.name}-explorer-ig-${each.value}"
  for_each = var.create_resources ? toset(var.regions) : []

  base_instance_name = "${var.name}-explorer-${each.value}"

  version {
    instance_template = google_compute_instance_template.daemon[each.value].self_link
    name              = "original"
  }

  region      = each.value
  target_size = var.size

  update_policy {
    type                  = "PROACTIVE"
    minimal_action        = "REPLACE"
    max_surge_fixed       = 3
    max_unavailable_fixed = 0
    min_ready_sec         = var.min_ready_sec
  }

  auto_healing_policies {
    health_check      = google_compute_health_check.daemon[0].self_link
    initial_delay_sec = var.initial_delay_sec
  }

  named_port {
    name = "electrs"
    port = 50001
  }

  named_port {
    name = "http"
    port = 80
  }

  lifecycle {
    ignore_changes = [
      name,
      base_instance_name,
    ]
  }
}

module "daemon_template" {
  source = "./cloud-config"

  for_each = var.create_resources ? toset(var.regions) : []

  docker_tag                  = var.docker_tag_explorer
  daemon                      = var.daemon
  network                     = var.network
  container_name              = "${var.name}-explorer"
  name                        = var.name
  docker_tag_node_exporter    = var.docker_tag_node_exporter
  docker_tag_process_exporter = var.docker_tag_process_exporter
  docker_tag_gcloud           = var.docker_tag_gcloud
  image_source_project        = var.image_source_project
  mempooldat                  = var.mempooldat
  fullurl                     = var.fullurl
  disk_type                   = var.disk_type
  region                      = each.value
}

## Create instance template
resource "google_compute_instance_template" "daemon" {
  name_prefix  = "${var.name}-explorer-template-"
  description  = "This template is used to create ${var.name} instances."
  machine_type = var.instance_type
  for_each     = var.create_resources ? toset(var.regions) : []

  labels = {
    type    = "explorer"
    name    = var.name
    network = var.network
    region  = each.value
  }

  scheduling {
    automatic_restart   = true
    on_host_maintenance = "MIGRATE"
  }

  disk {
    source_image = var.boot-image
    disk_type    = var.disk_type
    auto_delete  = true
    boot         = true
    disk_size_gb = "100"
  }

  network_interface {
    network = data.google_compute_network.default.self_link

    access_config {}
  }

  metadata = {
    google-logging-enabled = "true"
    user-data              = module.daemon_template[each.value].template.rendered
  }

  service_account {
    email = google_service_account.daemon[0].email
    scopes = [
      "compute-rw",
      "storage-ro",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring.write",
    ]
  }

  lifecycle {
    create_before_destroy = true
  }
}
