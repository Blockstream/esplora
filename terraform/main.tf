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

  name                     = "explorer"
  network                  = "default"
  zone                     = var.zone
  region                   = var.region
  instances                = 1
  machine_type             = var.instance_type
  retention                = "2d"
  project                  = var.project
  docker_tag               = var.docker_tag_prometheus
  docker_tag_node_exporter = var.docker_tag_node_exporter
  allowed_source_ip        = var.prometheus_allowed_source_ip
}
