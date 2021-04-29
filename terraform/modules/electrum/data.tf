data "google_compute_network" "default" {
  name = "default"
}

data "template_cloudinit_config" "electrum" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/cloud-config"
    content      = templatefile("${path.module}/cloud-init/electrum.yml", {})
  }
}
