data "google_compute_network" "default" {
  name = "default"
}

data "template_file" "prometheus" {
  template = "${file("${path.module}/cloud-init/prometheus.yml")}"

  vars = {
    docker_tag               = var.docker_tag
    docker_tag_node_exporter = var.docker_tag_node_exporter
    retention                = var.retention
    opsgenie_api_key         = var.opsgenie_api_key
  }
}

data "template_cloudinit_config" "prometheus" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/cloud-config"
    content      = data.template_file.prometheus.rendered
  }
}
