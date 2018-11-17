variable "create_resources" {
  type = "string"
}

variable "project" {
  type    = "string"
  default = "green-address-explorer"
}

variable "name" {
  type = "string"
}

variable "daemon" {
  type = "string"
}

variable "network" {
  type = "string"
}

variable "regions" {
  type = "list"
}

variable "instance_type" {
  type    = "string"
  default = ""
}

variable "image" {
  type = "string"
}

variable "size" {
  type = "string"
}

variable "boot-image" {
  type    = "string"
  default = "cos-cloud/cos-stable"
}

variable "service_account_prom" {
  type = "string"
}

variable "docker_tag_node_exporter" {
  type = "string"
}

variable "docker_tag_explorer" {
  type = "string"
}

variable "min_ready_sec" {
  type    = "string"
  default = "1800"
}

variable "initial_delay_sec" {
  type    = "string"
  default = "1800"
}
