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
  type    = list
  default = ["us-central1-a"]
}

variable "instances" {
  type = string
}

variable "machine_type" {
  type = string
}

variable "image" {
  type    = string
  default = "debian-cloud/debian-10"
}

variable "size" {
  type    = string
  default = "100"
}

variable "electrum_service_account" {
  type    = string
  default = ""
}
