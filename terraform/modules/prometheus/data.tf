data "google_compute_network" "default" {
  name = "default"
}

data "template_cloudinit_config" "prometheus" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/cloud-config"
    content = templatefile("${path.module}/cloud-init/prometheus.yml", {
      docker_tag               = var.docker_tag
      docker_tag_node_exporter = var.docker_tag_node_exporter
      retention                = var.retention
    })
  }
}
