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

data "terraform_remote_state" "bitcoin-mainnet" {
  backend = "gcs"

  config = {
    bucket = "terraform-bs-source"
    prefix = "green-address-explorer"
  }

  workspace = "bitcoin-mainnet"
}

data "terraform_remote_state" "bitcoin-testnet" {
  backend = "gcs"

  config = {
    bucket = "terraform-bs-source"
    prefix = "green-address-explorer"
  }

  workspace = "bitcoin-testnet"
}

data "terraform_remote_state" "liquid-mainnet" {
  backend = "gcs"

  config = {
    bucket = "terraform-bs-source"
    prefix = "green-address-explorer"
  }

  workspace = "liquid-mainnet"
}
