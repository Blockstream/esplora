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
