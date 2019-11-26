locals {
  context_variables = {
    "main" = {
      create_main            = 1
      create_bitcoin_mainnet = 0
      create_bitcoin_testnet = 0
      create_liquid_mainnet  = 0
    }

    "bitcoin-mainnet" = {
      create_main            = 0
      create_bitcoin_mainnet = 1
      create_bitcoin_testnet = 0
      create_liquid_mainnet  = 0
    }

    "bitcoin-testnet" = {
      create_main            = 0
      create_bitcoin_mainnet = 0
      create_bitcoin_testnet = 1
      create_liquid_mainnet  = 0
    }

    "liquid-mainnet" = {
      create_main            = 0
      create_bitcoin_mainnet = 0
      create_bitcoin_testnet = 0
      create_liquid_mainnet  = 1
    }
  }

  create_main            = lookup(local.context_variables[terraform.workspace], "create_main")
  create_bitcoin_mainnet = lookup(local.context_variables[terraform.workspace], "create_bitcoin_mainnet")
  create_bitcoin_testnet = lookup(local.context_variables[terraform.workspace], "create_bitcoin_testnet")
  create_liquid_mainnet  = lookup(local.context_variables[terraform.workspace], "create_liquid_mainnet")
}

variable "project" {
  type    = string
  default = "green-address-explorer"
}

variable "region" {
  type    = string
  default = "overwritten_by_ci"
}

variable "machine_type" {
  type    = string
  default = "overwritten_by_ci"
}

variable "cluster_size" {
  type    = string
  default = "overwritten_by_ci"
}

# lists overwritten by ci
variable "regions" {
  type    = list
  default = [""]
}

variable "ssl_certs" {
  type    = list
  default = []
}

variable "zones" {
  type    = list
  default = [""]
}

variable "instance_type" {
  type    = list
  default = ["", "", "", ""]
}

variable "preemptible_instance_type" {
  type    = list
  default = ["", "", "", ""]
}

variable "hosts" {
  type    = list
  default = [""]
}

variable "hosts_onion" {
  type    = list
  default = ["", ""]
}

# some hardcoded vars and misc
variable "docker_tag_nginx" {
  type = string

  # docker inspect --format='{{index .RepoDigests 0}}' nginx:alpine

  default = "nginx@sha256:ae5da813f8ad7fa785d7668f0b018ecc8c3a87331527a61d83b3b5e816a0f03c"
}

variable "docker_tag_node_exporter" {
  type = string

  # docker inspect --format='{{index .RepoDigests 0}}' prom/node-exporter:v0.16.0

  default = "prom/node-exporter@sha256:55302581333c43d540db0e144cf9e7735423117a733cdec27716d87254221086"
}

variable "docker_tag_explorer" {
  type    = string
  default = "overwritten_by_ci"
}

variable "docker_tag_tor" {
  type    = string
  default = "blockstream/tor@sha256:f4d1373cde79fd79b467d2d6da88e37b0da137924bc10ae2d51a83c686c2c125"
}

variable "docker_tag_prometheus" {
  type    = string
  default = "gcr.io/green-address-explorer/prometheus@sha256:f3817443defecd22e51017769a8835dca21ea87f7d1edf6d78e007c90e813843"
}

variable "min_ready_sec" {
  type        = string
  description = "How long should autoscaling wait before executing another action?"
  default     = "900"
}

variable "initial_delay_sec" {
  type        = string
  description = "How long should the instance group healthcheck wait before checking instances?"
  default     = "1800"
}

variable "prometheus_allowed_source_ip" {
  description = "The IP that is allowed to access the prometheus instance."
  default     = ""
}

variable "opsgenie_api_key" {
  default = ""
}

variable "kms_location" {
  default = "us-central1"
}

variable "image_source_project" {
  type    = string
  default = ""
}

variable "mempooldat" {
  type    = string
  default = ""
}

variable "fullurl" {
  type    = string
  default = ""
}
