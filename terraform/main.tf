terraform {
  required_version = "> 1.3.7"

  required_providers {
    google      = "~> 4.52.0"
    google-beta = "~> 4.52.0"
  }

  backend "gcs" {
    bucket = "terraform-bs-source"
    prefix = "green-address-explorer"
  }
}

provider "google" {
  project = var.project
}

provider "google-beta" {
  project = var.project
}

module "prometheus" {
  source = "./modules/prometheus"

  name                       = "explorer"
  network                    = "default"
  zones                      = var.zones
  region                     = var.regions[0]
  instances                  = 1
  machine_type               = var.instance_type
  retention                  = "2d"
  project                    = var.project
  docker_tag                 = var.docker_tag_prometheus
  docker_tag_node_exporter   = var.docker_tag_node_exporter
  allowed_source_ip          = var.prometheus_allowed_source_ip
  prometheus_service_account = terraform.workspace != "main" ? data.terraform_remote_state.main.outputs.prometheus_service_account : ""

  create_resources = local.create_main
}

module "electrum" {
  source = "./modules/electrum"

  name                     = "lb"
  network                  = "default"
  zones                    = var.zones
  region                   = var.regions[0]
  instances                = 1
  machine_type             = "e2-standard-2"
  project                  = var.project
  electrum_service_account = terraform.workspace != "main" ? data.terraform_remote_state.main.outputs.electrum_service_account : ""

  create_resources = local.create_main
}

module "tor" {
  source = "./modules/tor"

  name                     = "explorer-tor"
  network                  = "default"
  zones                    = var.zones[0]
  region                   = var.regions[0]
  instances                = 1
  project                  = var.project
  tor_machine_type         = var.instance_type
  tor_lb                   = element(concat(google_compute_global_address.onion-lb.*.address, tolist([""])), 0)
  docker_tag               = var.docker_tag_tor
  hosts_onion              = var.hosts_onion
  kms_key                  = element(concat(google_kms_crypto_key.esplora-crypto-key.*.name, tolist([""])), 0)
  kms_key_link             = element(concat(google_kms_crypto_key.esplora-crypto-key.*.id, tolist([""])), 0)
  kms_key_ring             = element(concat(google_kms_key_ring.esplora-key-ring.*.name, tolist([""])), 0)
  kms_location             = var.kms_location
  service_account_prom     = terraform.workspace == "main" ? module.prometheus.service_account : data.terraform_remote_state.main.outputs.prometheus_service_account
  docker_tag_node_exporter = var.docker_tag_node_exporter

  create_resources = local.create_main
}

module "bitcoin-testnet" {
  source = "./modules/daemon"

  regions                     = [var.regions[0]]
  name                        = "bitcoin-testnet"
  daemon                      = "bitcoin"
  mempooldat                  = var.mempooldat
  fullurl                     = var.fullurl
  network                     = "testnet"
  disk_type                   = var.disk_type
  instance_type               = var.instance_type
  size                        = var.cluster_size
  project                     = var.project
  service_account_prom        = terraform.workspace == "main" ? module.prometheus.service_account : data.terraform_remote_state.main.outputs.prometheus_service_account
  docker_tag_node_exporter    = var.docker_tag_node_exporter
  docker_tag_process_exporter = var.docker_tag_process_exporter
  docker_tag_explorer         = var.docker_tag_explorer
  min_ready_sec               = var.min_ready_sec
  initial_delay_sec           = var.initial_delay_sec
  image_source_project        = var.image_source_project

  create_resources = local.create_bitcoin_testnet
}

module "bitcoin-mainnet" {
  source = "./modules/daemon"

  regions                     = var.regions
  name                        = "bitcoin-mainnet"
  daemon                      = "bitcoin"
  network                     = "mainnet"
  disk_type                   = var.disk_type
  mempooldat                  = var.mempooldat
  fullurl                     = var.fullurl
  instance_type               = var.instance_type
  size                        = var.cluster_size
  project                     = var.project
  service_account_prom        = terraform.workspace == "main" ? module.prometheus.service_account : data.terraform_remote_state.main.outputs.prometheus_service_account
  docker_tag_node_exporter    = var.docker_tag_node_exporter
  docker_tag_process_exporter = var.docker_tag_process_exporter
  docker_tag_explorer         = var.docker_tag_explorer
  min_ready_sec               = var.min_ready_sec
  initial_delay_sec           = var.initial_delay_sec
  image_source_project        = var.image_source_project

  create_resources = local.create_bitcoin_mainnet
}

module "liquid-mainnet" {
  source = "./modules/daemon"

  regions                     = [var.regions[0]]
  name                        = "liquid-mainnet"
  daemon                      = "liquid"
  network                     = "mainnet"
  disk_type                   = var.disk_type
  mempooldat                  = var.mempooldat
  fullurl                     = var.fullurl
  instance_type               = var.instance_type
  size                        = var.cluster_size
  project                     = var.project
  service_account_prom        = terraform.workspace == "main" ? module.prometheus.service_account : data.terraform_remote_state.main.outputs.prometheus_service_account
  docker_tag_node_exporter    = var.docker_tag_node_exporter
  docker_tag_process_exporter = var.docker_tag_process_exporter
  docker_tag_explorer         = var.docker_tag_explorer
  min_ready_sec               = var.min_ready_sec
  initial_delay_sec           = var.initial_delay_sec
  image_source_project        = var.image_source_project

  create_resources = local.create_liquid_mainnet
}

module "liquid-testnet" {
  source = "./modules/daemon"

  regions                     = [var.regions[0]]
  name                        = "liquid-testnet"
  daemon                      = "liquid"
  network                     = "testnet"
  disk_type                   = var.disk_type
  mempooldat                  = var.mempooldat
  fullurl                     = var.fullurl
  instance_type               = var.instance_type
  size                        = var.cluster_size
  project                     = var.project
  service_account_prom        = terraform.workspace == "main" ? module.prometheus.service_account : data.terraform_remote_state.main.outputs.prometheus_service_account
  docker_tag_node_exporter    = var.docker_tag_node_exporter
  docker_tag_process_exporter = var.docker_tag_process_exporter
  docker_tag_explorer         = var.docker_tag_explorer
  min_ready_sec               = var.min_ready_sec
  initial_delay_sec           = var.initial_delay_sec
  image_source_project        = var.image_source_project

  create_resources = local.create_liquid_testnet
}
