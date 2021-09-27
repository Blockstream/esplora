variable "create_resources" {
  type = string
}

variable "project" {
  type = string
}

variable "name" {
  type = string
}

variable "network" {
  type    = string
  default = "default"
}

variable "region" {
  type = string
}

variable "zones" {
  type    = list(any)
  default = ["us-central1-a"]
}

variable "instances" {
  type = string
}

variable "docker_tag" {
  type = string
}

variable "machine_type" {
  type = string
}

variable "image" {
  type    = string
  default = "cos-cloud/cos-stable"
}

variable "size" {
  type    = string
  default = "100"
}

variable "retention" {
  type    = string
  default = "31d"
}

variable "docker_tag_node_exporter" {
  type = string
}

variable "allowed_source_ip" {
  type        = list(any)
  description = "Which IPs are allowed to access the instance?"
}

variable "prometheus_service_account" {
  type    = string
  default = ""
}
