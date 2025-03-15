variable "project" {
  type    = string
  default = "green-address-explorer"
}

variable "region" {
  type    = string
  default = "us-central1"
}

variable "zone" {
  type    = string
  default = ""
}

variable "instance_type" {
  type    = string
  default = "e2-medium"
}

variable "docker_tag_node_exporter" {
  type = string

  # docker inspect --format='{{index .RepoDigests 0}}' prom/node-exporter:v1.2.2
  default = "prom/node-exporter@sha256:a990408ed288669bbad5b5b374fe1584e54825cde4a911c1a3d6301a907a030c"
}

variable "docker_tag_prometheus" {
  type = string

  # docker inspect --format='{{index .RepoDigests 0}}' prom/prometheus:v2.29.1
  default = "prom/prometheus@sha256:ccc801f38fdac43f0ed3e1b0220777e976828d6558f8ef3baad9028e0d1797ae"
}

variable "prometheus_allowed_source_ip" {
  type        = list(any)
  description = "The IPs that are allowed to access the prometheus instance."
  default     = []
}
