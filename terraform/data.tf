data "terraform_remote_state" "main" {
  backend = "gcs"

  config = {
    bucket = "terraform-bs-source"
    prefix = "green-address-explorer"
  }

  workspace = "main"

  defaults = {
    prometheus_service_account = ""
  }
}
