data "google_compute_network" "default" {
  name = "default"
}

data "template_file" "builder" {
  template = "${file("${path.module}/cloud-init/builder.yml")}"

  vars {
    docker_tag        = "${var.docker_tag_explorer}"
    docker_tag_gcloud = "${var.docker_tag_gcloud}"
    daemon            = "${var.daemon}"
    network           = "${var.network}"
    name              = "${var.name}"
    container_name    = "${var.name}-explorer"
    request_path      = "${var.name == "bitcoin-mainnet" ? "/api/tip/hash" : var.name == "bitcoin-testnet" ? "/testnet/api/tip/hash" : "/liquid/api/tip/hash"}"
  }
}

data "template_cloudinit_config" "builder" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/cloud-config"
    content      = "${data.template_file.builder.rendered}"
  }
}
