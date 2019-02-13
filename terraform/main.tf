terraform {
  required_version = "> 0.11.0"

  backend "gcs" {
    bucket  = "terraform-state-explorer"
    prefix  = "terraform/state"
    project = "green-address-explorer"
  }
}

provider "google" {
  project = "${var.project}"
}

provider "google-beta" {
  project = "${var.project}"
}

module "prometheus" {
  source = "modules/prometheus"

  name                       = "explorer"
  network                    = "default"
  zones                      = ["${var.zones}"]
  region                     = "${var.regions[0]}"
  instances                  = 1
  machine_type               = "${var.instance_type[2]}"
  retention                  = "31d"
  project                    = "${var.project}"
  docker_tag                 = "${var.docker_tag_prometheus}"
  docker_tag_node_exporter   = "${var.docker_tag_node_exporter}"
  allowed_source_ip          = "${var.prometheus_allowed_source_ip}"
  prometheus_service_account = "${terraform.workspace != "main" ? data.terraform_remote_state.main.prometheus_service_account : ""}"
  opsgenie_api_key           = "${var.opsgenie_api_key}"

  create_resources = "${local.create_main}"
}

module "tor" {
  source = "modules/tor"

  name                     = "explorer-tor"
  network                  = "default"
  zones                    = "${var.zones[0]}"
  region                   = "${var.regions[0]}"
  instances                = 1
  project                  = "${var.project}"
  tor_machine_type         = "${var.instance_type[3]}"
  tor_lb                   = "${element(concat(google_compute_global_address.onion-lb.*.address, list("")), 0)}"
  docker_tag               = "${var.docker_tag_tor}"
  hosts_onion              = "${var.hosts_onion}"
  kms_key                  = "${element(concat(google_kms_crypto_key.esplora-crypto-key.*.name, list("")), 0)}"
  kms_key_link             = "${element(concat(google_kms_crypto_key.esplora-crypto-key.*.self_link, list("")), 0)}"
  kms_key_ring             = "${element(concat(google_kms_key_ring.esplora-key-ring.*.name, list("")), 0)}"
  kms_location             = "${var.kms_location}"
  service_account_prom     = "${terraform.workspace == "main" ? module.prometheus.service_account : data.terraform_remote_state.main.prometheus_service_account}"
  docker_tag_node_exporter = "${var.docker_tag_node_exporter}"

  create_resources = "${local.create_main}"
}

module "bitcoin-testnet" {
  source = "modules/daemon"

  regions                  = "${var.regions}"
  name                     = "bitcoin-testnet"
  daemon                   = "bitcoin"
  network                  = "testnet"
  instance_type            = "${var.instance_type[1]}"
  size                     = "${var.cluster_size}"
  image                    = "${data.google_compute_image.btc-test.self_link}"
  project                  = "${var.project}"
  service_account_prom     = "${terraform.workspace == "main" ? module.prometheus.service_account : data.terraform_remote_state.main.prometheus_service_account}"
  docker_tag_node_exporter = "${var.docker_tag_node_exporter}"
  docker_tag_explorer      = "${var.docker_tag_explorer}"
  min_ready_sec            = "${var.min_ready_sec}"
  initial_delay_sec        = "${var.initial_delay_sec}"

  create_resources = "${local.create_bitcoin_testnet}"
}

module "bitcoin-testnet-http" {
  source = "modules/http-tor"

  regions                  = ["${element(var.regions, 0)}"]
  name                     = "bitcoin-testnet"
  network                  = "testnet"
  project                  = "${var.project}"
  service_account_prom     = "${terraform.workspace == "main" ? module.prometheus.service_account : data.terraform_remote_state.main.prometheus_service_account}"
  docker_tag_node_exporter = "${var.docker_tag_node_exporter}"
  docker_tag_nginx         = "${var.docker_tag_nginx}"
  ssl_certs                = "${var.ssl_certs}"

  create_resources = "${local.create_bitcoin_testnet}"
}

module "bitcoin-mainnet" {
  source = "modules/daemon"

  regions                  = "${var.regions}"
  name                     = "bitcoin-mainnet"
  daemon                   = "bitcoin"
  network                  = "mainnet"
  instance_type            = "${var.instance_type[0]}"
  size                     = "${var.cluster_size}"
  image                    = "${data.google_compute_image.btc-main.self_link}"
  project                  = "${var.project}"
  service_account_prom     = "${terraform.workspace == "main" ? module.prometheus.service_account : data.terraform_remote_state.main.prometheus_service_account}"
  docker_tag_node_exporter = "${var.docker_tag_node_exporter}"
  docker_tag_explorer      = "${var.docker_tag_explorer}"
  min_ready_sec            = "${var.min_ready_sec}"
  initial_delay_sec        = "${var.initial_delay_sec}"

  create_resources = "${local.create_bitcoin_mainnet}"
}

module "bitcoin-mainnet-http" {
  source = "modules/http-tor"

  regions                  = ["${var.regions[0]}"]
  name                     = "bitcoin-mainnet"
  network                  = "mainnet"
  project                  = "${var.project}"
  service_account_prom     = "${terraform.workspace == "main" ? module.prometheus.service_account : data.terraform_remote_state.main.prometheus_service_account}"
  docker_tag_node_exporter = "${var.docker_tag_node_exporter}"
  docker_tag_nginx         = "${var.docker_tag_nginx}"
  ssl_certs                = "${var.ssl_certs}"

  create_resources = "${local.create_bitcoin_mainnet}"
}

module "liquid-mainnet" {
  source = "modules/daemon"

  regions                  = "${var.regions}"
  name                     = "liquid-mainnet"
  daemon                   = "liquid"
  network                  = "mainnet"
  instance_type            = "${var.instance_type[1]}"
  size                     = "${var.cluster_size}"
  image                    = "${data.google_compute_image.liquid-main.self_link}"
  project                  = "${var.project}"
  service_account_prom     = "${terraform.workspace == "main" ? module.prometheus.service_account : data.terraform_remote_state.main.prometheus_service_account}"
  docker_tag_node_exporter = "${var.docker_tag_node_exporter}"
  docker_tag_explorer      = "${var.docker_tag_explorer}"
  min_ready_sec            = "${var.min_ready_sec}"
  initial_delay_sec        = "${var.initial_delay_sec}"

  create_resources = "${local.create_liquid_mainnet}"
}

module "liquid-mainnet-http" {
  source = "modules/http-tor"

  regions                  = ["${var.regions[0]}"]
  name                     = "liquid-mainnet"
  network                  = "mainnet"
  project                  = "${var.project}"
  service_account_prom     = "${terraform.workspace == "main" ? module.prometheus.service_account : data.terraform_remote_state.main.prometheus_service_account}"
  docker_tag_node_exporter = "${var.docker_tag_node_exporter}"
  docker_tag_nginx         = "${var.docker_tag_nginx}"
  ssl_certs                = "${var.ssl_certs}"

  create_resources = "${local.create_liquid_mainnet}"
}
