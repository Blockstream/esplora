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

variable "network" {
  type = "string"
}

variable "regions" {
  type    = "list"
  default = []
}

variable "ssl_certs" {
  type = "list"
}

variable "boot-image" {
  type    = "string"
  default = "cos-cloud/cos-stable"
}

variable "docker_tag_nginx" {
  type = "string"
}

variable "docker_tag_node_exporter" {
  type = "string"
}

variable "service_account_prom" {
  type = "string"
}
