data "google_compute_network" "default" {
  name = "default"
}

data "template_file" "tor" {
  template = file("${path.module}/cloud-init/tor.yaml")

  vars = {
    tor_lb  = var.tor_lb
    v2_host = var.hosts_onion[0]
    v3_host = var.hosts_onion[1]
    v2_pk   = file("${path.module}/v2.pk")
    v3_pk   = file("${path.module}/v3.pk")
    v3_pubk = file("${path.module}/v3.pubk")

    docker_tag               = var.docker_tag
    docker_tag_gcloud        = var.docker_tag_gcloud
    kms_key                  = var.kms_key
    kms_key_ring             = var.kms_key_ring
    kms_location             = var.kms_location
    docker_tag_node_exporter = var.docker_tag_node_exporter
  }
}

data "template_cloudinit_config" "tor" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/cloud-config"
    content      = data.template_file.tor.rendered
  }
}
