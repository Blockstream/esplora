locals {
  context_variables = {
    "main" = {
      create_main            = 1
      create_bitcoin_mainnet = 0
      create_bitcoin_testnet = 0
      create_liquid_mainnet  = 0
      create_liquid_testnet  = 0
    }

    "bitcoin-mainnet" = {
      create_main            = 0
      create_bitcoin_mainnet = 1
      create_bitcoin_testnet = 0
      create_liquid_mainnet  = 0
      create_liquid_testnet  = 0
    }

    "bitcoin-testnet" = {
      create_main            = 0
      create_bitcoin_mainnet = 0
      create_bitcoin_testnet = 1
      create_liquid_mainnet  = 0
      create_liquid_testnet  = 0
    }

    "liquid-mainnet" = {
      create_main            = 0
      create_bitcoin_mainnet = 0
      create_bitcoin_testnet = 0
      create_liquid_mainnet  = 1
      create_liquid_testnet  = 0
    }

    "liquid-testnet" = {
      create_main            = 0
      create_bitcoin_mainnet = 0
      create_bitcoin_testnet = 0
      create_liquid_mainnet  = 0
      create_liquid_testnet  = 1
    }
  }

  create_main            = lookup(local.context_variables[terraform.workspace], "create_main")
  create_bitcoin_mainnet = lookup(local.context_variables[terraform.workspace], "create_bitcoin_mainnet")
  create_bitcoin_testnet = lookup(local.context_variables[terraform.workspace], "create_bitcoin_testnet")
  create_liquid_mainnet  = lookup(local.context_variables[terraform.workspace], "create_liquid_mainnet")
  create_liquid_testnet  = lookup(local.context_variables[terraform.workspace], "create_liquid_testnet")
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

variable "preemptible_cluster_size" {
  type    = string
  default = "overwritten_by_ci"
}

# lists overwritten by ci
variable "regions" {
  type    = list(any)
  default = [""]
}

variable "ssl_certs" {
  type    = list(any)
  default = []
}

variable "zones" {
  type    = list(any)
  default = [""]
}

variable "instance_type" {
  type    = string
  default = ""
}

variable "preemptible_instance_type" {
  type    = string
  default = ""
}

variable "hosts" {
  type    = list(any)
  default = [""]
}

variable "hosts_onion" {
  type    = list(any)
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

  # docker inspect --format='{{index .RepoDigests 0}}' prom/node-exporter:v1.2.2
  default = "prom/node-exporter@sha256:a990408ed288669bbad5b5b374fe1584e54825cde4a911c1a3d6301a907a030c"
}

variable "docker_tag_process_exporter" {
  type = string

  # docker inspect --format='{{index .RepoDigests 0}}' ncabatoff/process-exporter:0.7.4
  default = "ncabatoff/process-exporter@sha256:80f89e0c882cb3bba2fa577e090198bc60127b40e52c65443a657637fc24b0bd"
}

variable "docker_tag_explorer" {
  type    = string
  default = "overwritten_by_ci"
}

variable "docker_tag_tor" {
  type    = string
  default = "blockstream/tor@sha256:378aa7ee44452617ba46369e7e27cc89c2704b9d53442cf016543a24e46f984a"
}

variable "docker_tag_prometheus" {
  type = string

  # docker inspect --format='{{index .RepoDigests 0}}' prom/prometheus:v2.29.1
  default = "prom/prometheus@sha256:ccc801f38fdac43f0ed3e1b0220777e976828d6558f8ef3baad9028e0d1797ae"
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
  type        = list(any)
  description = "The IPs that are allowed to access the prometheus instance."
  default     = []
}

variable "kms_location" {
  default = "us-central1"
}

variable "disk_type" {
  type    = string
  default = "pd-balanced"
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
