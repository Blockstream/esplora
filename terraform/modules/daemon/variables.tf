variable "create_resources" {
  type = string
}

variable "project" {
  type    = string
  default = "green-address-explorer"
}

variable "name" {
  type = string
}

variable "daemon" {
  type = string
}

variable "network" {
  type = string
}

variable "regions" {
  type = list
}

variable "instance_type" {
  type    = string
  default = ""
}

variable "preemptible_instance_type" {
  type    = string
  default = ""
}

variable "size" {
  type = string
}

variable "boot-image" {
  type    = string
  default = "cos-cloud/cos-stable"
}

variable "service_account_prom" {
  type = string
}

variable "docker_tag_node_exporter" {
  type = string
}

variable "docker_tag_explorer" {
  type = string
}

variable "docker_tag_gcloud" {
  type    = string
  default = "google/cloud-sdk@sha256:ff12e5d576a0754bcc25073e8bad8ae07623af66fa4c4f4a037ca33f46855028"
}

variable "min_ready_sec" {
  type    = string
  default = "1800"
}

variable "initial_delay_sec" {
  type    = string
  default = "1800"
}

variable "image_source_project" {
  type = string
}

variable "mempooldat" {
  type    = string
  default = ""
}

variable "fullurl" {
  type    = string
  default = ""
}
