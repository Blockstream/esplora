# Create regional instance group
resource "google_compute_region_instance_group_manager" "preemptible-daemon" {
  provider = google-beta
  name     = "${var.name}-explorer-pig-${var.regions[count.index]}"
  count    = var.create_resources > 0 ? length(var.regions) : 0

  base_instance_name = "${var.name}-pexplorer-${var.regions[count.index]}-${count.index}"

  version {
    instance_template = google_compute_instance_template.preemptible-daemon[0].self_link
    name              = "original"
  }

  region      = var.regions[count.index]
  target_size = var.preemptible_size

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
}

## Create instance template
resource "google_compute_instance_template" "preemptible-daemon" {
  name_prefix  = "${var.name}-pexplorer-template-"
  description  = "This template is used to create preemptible ${var.name} instances."
  machine_type = var.preemptible_instance_type
  count        = var.create_resources

  labels = {
    type        = "explorer"
    name        = var.name
    network     = var.network
    preemptible = "1"
  }

  scheduling {
    automatic_restart   = false
    on_host_maintenance = "TERMINATE"
    preemptible         = true
  }

  disk {
    source_image = var.boot-image
    disk_type    = "pd-ssd"
    auto_delete  = true
    boot         = true
    disk_size_gb = "20"
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
