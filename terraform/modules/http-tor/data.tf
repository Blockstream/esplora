data "google_compute_network" "default" {
  name = "default"
}

data "template_file" "http" {
  template = "${file("${path.module}/cloud-init/http.yml")}"

  vars {
    docker_tag_nginx         = "${var.docker_tag_nginx}"
    docker_tag_node_exporter = "${var.docker_tag_node_exporter}"
  }
}

data "template_cloudinit_config" "http" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/cloud-config"
    content      = "${data.template_file.http.rendered}"
  }
}

# https://github.com/DeviaVir/terraform-provider-customconfig/blob/master/examples/backend_service_instance_groups.tf
data "customconfig_google_backend" "customconfig" {
  instance_groups = ["${google_compute_region_instance_group_manager.http.*.instance_group}"]
}
