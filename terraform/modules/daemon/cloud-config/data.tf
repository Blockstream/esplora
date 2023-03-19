data "template_cloudinit_config" "daemon" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/cloud-config"
    content = templatefile("${path.module}/daemon.yml", {
      docker_tag                  = var.docker_tag
      daemon                      = var.daemon
      network                     = var.network
      container_name              = var.container_name
      name                        = var.name
      docker_tag_node_exporter    = var.docker_tag_node_exporter
      docker_tag_process_exporter = var.docker_tag_process_exporter
      docker_tag_gcloud           = var.docker_tag_gcloud
      image_source_project        = var.image_source_project
      mempooldat                  = var.mempooldat
      fullurl                     = var.fullurl
      region                      = var.region
      disk_type                   = var.disk_type
    })
  }
}
