data "google_compute_network" "default" {
  name = "default"
}

data "template_file" "daemon" {
  template = "${file("${path.module}/cloud-config/daemon.yml")}"

  vars {
    docker_tag               = "${var.docker_tag_explorer}"
    daemon                   = "${var.daemon}"
    network                  = "${var.network}"
    container_name           = "${var.name}-explorer"
    name                     = "${var.name}"
    docker_tag_node_exporter = "${var.docker_tag_node_exporter}"
    docker_tag_gcloud        = "${var.docker_tag_gcloud}"
    image_source_project     = "${var.image_source_project}"
  }
}

data "template_cloudinit_config" "daemon" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/cloud-config"
    content      = "${data.template_file.daemon.rendered}"
  }
}

# https://github.com/DeviaVir/terraform-provider-customconfig/blob/master/examples/backend_service_instance_groups.tf
data "customconfig_google_backend" "customconfig" {
  instance_groups = ["${google_compute_region_instance_group_manager.daemon.*.instance_group}"]
}
