variable "boot_image" {
  type    = "string"
  default = "cos-cloud/cos-stable"
}

variable "initial_delay_sec" {
  type    = "string"
  default = "300"
}

variable "network" {
  type    = "string"
  default = "default"
}

variable "project" {
  type = "string"
}

variable "name" {
  type = "string"
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

variable "hosts_onion" {
  default = ["", ""]
}
