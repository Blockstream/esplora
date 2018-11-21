module "builder-bitcoin-testnet" {
  source = "modules/builder"

  zones               = ["${var.zones}"]
  name                = "bitcoin-testnet"
  daemon              = "bitcoin"
  network             = "testnet"
  instance_type       = "${var.machine_type}"
  cluster_size        = "${var.cluster_size}"
  image               = "${data.google_compute_image.btc-test.self_link}"
  project             = "${var.project}"
  docker_tag_explorer = "${var.docker_tag_explorer}"

  create_resources = "${local.create_builders}"
}

module "builder-bitcoin-mainnet" {
  source = "modules/builder"

  zones               = ["${var.zones}"]
  name                = "bitcoin-mainnet"
  daemon              = "bitcoin"
  network             = "mainnet"
  instance_type       = "${var.machine_type}"
  cluster_size        = "${var.cluster_size}"
  image               = "${data.google_compute_image.btc-main.self_link}"
  project             = "${var.project}"
  docker_tag_explorer = "${var.docker_tag_explorer}"

  create_resources = "${local.create_builders}"
}

module "builder-liquid-mainnet" {
  source = "modules/builder"

  zones               = ["${var.zones}"]
  name                = "liquid-mainnet"
  daemon              = "liquid"
  network             = "mainnet"
  instance_type       = "${var.machine_type}"
  cluster_size        = "${var.cluster_size}"
  image               = "${data.google_compute_image.liquid-main.self_link}"
  project             = "${var.project}"
  docker_tag_explorer = "${var.docker_tag_explorer}"

  create_resources = "${local.create_builders}"
}
