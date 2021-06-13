data "google_compute_network" "default" {
  name = "default"
}

data "template_cloudinit_config" "http" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/cloud-config"
    content = templatefile("${path.module}/cloud-init/http.yml", {
      docker_tag_nginx         = var.docker_tag_nginx
      docker_tag_node_exporter = var.docker_tag_node_exporter
    })
  }
}
