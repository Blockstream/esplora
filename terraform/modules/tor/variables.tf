variable "boot_image" {
  type    = "string"
  default = "cos-cloud/cos-stable"
}

variable "project" {
  type = "string"
}

variable "name" {
  type = "string"
}

variable "network" {
  type    = "string"
  default = "default"
}

variable "region" {
  type = "string"
}

variable "zones" {
  type = "string"
}

variable "instances" {
  type = "string"
}

variable "tor_machine_type" {
  type = "string"
}

variable "tor_lb" {
  type = "string"
}

variable "create_resources" {
  type = "string"
}

variable "docker_tag" {
  type = "string"
}

variable "docker_tag_gcloud" {
  type    = "string"
  default = "google/cloud-sdk@sha256:b0d0555efef6a566f42fc4f0d89be9e1d74aff4565e27bbd206405f759d3f2b0"
}

variable "hosts_onion" {
  default = ["", ""]
}

variable "kms_key_link" {
  type = "string"
}

variable "kms_key" {
  type = "string"
}

variable "kms_key_ring" {
  type = "string"
}

variable "kms_location" {
  type = "string"
}

variable "docker_tag_node_exporter" {
  type = "string"
}

variable "service_account_prom" {
  type = "string"
}
