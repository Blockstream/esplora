# Re-using images that are already close to caught up with each chain
data "google_compute_image" "btc-main" {
  family  = "bitcoin-mainnet-new-index"
  project = "green-address-explorer"
}

data "google_compute_image" "btc-test" {
  family  = "bitcoin-testnet-new-index"
  project = "green-address-explorer"
}

data "google_compute_image" "liquid-main" {
  family  = "liquid-mainnet-new-index"
  project = "green-address-explorer"
}

data "terraform_remote_state" "main" {
  backend = "gcs"

  config {
    bucket  = "terraform-state-explorer"
    prefix  = "terraform/state"
    project = "green-address-explorer"
  }

  workspace = "main"

  defaults {
    prometheus_service_account = ""
  }
}

data "terraform_remote_state" "bitcoin-mainnet" {
  backend = "gcs"

  config {
    bucket  = "terraform-state-explorer"
    prefix  = "terraform/state"
    project = "green-address-explorer"
  }

  workspace = "bitcoin-mainnet"
}

data "terraform_remote_state" "bitcoin-testnet" {
  backend = "gcs"

  config {
    bucket  = "terraform-state-explorer"
    prefix  = "terraform/state"
    project = "green-address-explorer"
  }

  workspace = "bitcoin-testnet"
}

data "terraform_remote_state" "liquid-mainnet" {
  backend = "gcs"

  config {
    bucket  = "terraform-state-explorer"
    prefix  = "terraform/state"
    project = "green-address-explorer"
  }

  workspace = "liquid-mainnet"
}
