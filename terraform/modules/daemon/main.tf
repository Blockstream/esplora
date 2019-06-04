# Instance health check
resource "google_compute_health_check" "daemon" {
  name                = "${var.name}-explorer-health-check"
  timeout_sec         = 30
  check_interval_sec  = 60
  unhealthy_threshold = 5

  count = var.create_resources

  http_health_check {
    port         = 80
    request_path = var.name == "bitcoin-mainnet" ? "/api/blocks/tip/hash" : var.name == "bitcoin-testnet" ? "/testnet/api/blocks/tip/hash" : "/liquid/api/blocks/tip/hash"
  }
}

# Create regional instance group
resource "google_compute_region_instance_group_manager" "daemon" {
  provider = "google-beta"
  name     = "${var.name}-explorer-ig-${var.regions[count.index]}"
  count    = var.create_resources > 0 ? length(var.regions) : 0

  base_instance_name = "${var.name}-explorer-${var.regions[count.index]}-${count.index}"

  version {
    instance_template = google_compute_instance_template.daemon[0].self_link
    name              = "original"
  }

  region      = var.regions[count.index]
  target_size = var.size

  update_policy {
    // An opportunistic update is only applied when new instances are created by the managed instance group.
    // This typically happens when the managed instance group is resized either by another service,
    // such as an autoscaler, or manually by a user. Compute Engine does not actively initiate requests to apply updates.
    type = "OPPORTUNISTIC"

    minimal_action        = "REPLACE"
    max_surge_fixed       = 3
    max_unavailable_fixed = 0
    min_ready_sec         = var.min_ready_sec
  }

  auto_healing_policies {
    health_check      = google_compute_health_check.daemon[0].self_link
    initial_delay_sec = var.initial_delay_sec
  }
}

## Create instance template
resource "google_compute_instance_template" "daemon" {
  name_prefix  = "${var.name}-explorer-template-"
  description  = "This template is used to create ${var.name} instances."
  machine_type = var.instance_type
  count        = var.create_resources

  labels = {
    type    = "explorer"
    name    = var.name
    network = var.network
  }

  scheduling {
    automatic_restart   = true
    on_host_maintenance = "MIGRATE"
  }

  disk {
    source_image = var.boot-image
    disk_type    = "pd-ssd"
    auto_delete  = true
    boot         = true
  }

  network_interface {
    network = data.google_compute_network.default.self_link

    access_config {}
  }

  metadata = {
    google-logging-enabled = "true"
    user-data              = data.template_cloudinit_config.daemon.rendered
  }

  service_account {
    email  = google_service_account.daemon[0].email
    scopes = ["compute-rw", "storage-ro", "https://www.googleapis.com/auth/logging.write"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "null_resource" "ansible-daemon" {
  triggers = {
    daemons = google_compute_instance_template.daemon[0].self_link
  }

  count = var.create_resources > 0 ? length(var.regions) : 0

  provisioner "local-exec" {
    command     = "ansible-playbook rotate-daemons.yml -e region=${var.regions[count.index]} -e project=${var.project} -e target_size=${var.size} -e instance_group=${var.name}-explorer-ig-${var.regions[count.index]} -e backend_service=${var.name}-explorer-backend-service -e instance_name_prefix=${var.name}-explorer-${var.regions[count.index]} -e initial_delay_sec=${var.initial_delay_sec}"
    working_dir = "../ansible/"
  }
}
