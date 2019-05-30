resource "google_compute_global_address" "onion-lb" {
  name    = "explorer-address-onion-lb"
  project = var.project

  count = local.create_main
}

resource "google_compute_global_forwarding_rule" "rule-onion" {
  name        = "explorer-onion-forwarding-rule"
  target      = google_compute_target_http_proxy.onion-proxy[0].self_link
  port_range  = "80"
  ip_protocol = "TCP"
  ip_address  = google_compute_global_address.onion-lb[0].address

  count = local.create_main
}

resource "google_compute_target_http_proxy" "onion-proxy" {
  name    = "explorer-onion-proxy"
  url_map = google_compute_url_map.onion-proxy[0].self_link

  count = local.create_main
}

resource "google_compute_url_map" "onion-proxy" {
  name            = "explorer-onion-urlmap"
  default_service = google_compute_backend_bucket.onion_deadhole_backend[0].self_link

  count = local.create_main

  host_rule {
    hosts        = ["*"]
    path_matcher = "deadpaths"
  }

  path_matcher {
    name            = "deadpaths"
    default_service = google_compute_backend_bucket.onion_deadhole_backend[0].self_link

    path_rule {
      paths   = ["/*"]
      service = google_compute_backend_bucket.onion_deadhole_backend[0].self_link
    }
  }

  host_rule {
    hosts        = var.hosts_onion
    path_matcher = "allpaths"
  }

  path_matcher {
    name            = "allpaths"
    default_service = data.terraform_remote_state.bitcoin-mainnet.outputs.daemon_backend_service["bitcoin-mainnet"]

    path_rule {
      paths   = ["/*"]
      service = data.terraform_remote_state.bitcoin-mainnet.outputs.daemon_backend_service["bitcoin-mainnet"]
    }

    path_rule {
      paths   = ["/testnet", "/testnet/*"]
      service = data.terraform_remote_state.bitcoin-testnet.outputs.daemon_backend_service["bitcoin-testnet"]
    }

    path_rule {
      paths   = ["/liquid", "/liquid/*"]
      service = data.terraform_remote_state.liquid-mainnet.outputs.daemon_backend_service["liquid-mainnet"]
    }
  }

  test {
    service = data.terraform_remote_state.bitcoin-mainnet.outputs.daemon_backend_service["bitcoin-mainnet"]
    host    = var.hosts_onion[0]
    path    = "/"
  }

  test {
    service = data.terraform_remote_state.bitcoin-testnet.outputs.daemon_backend_service["bitcoin-testnet"]
    host    = var.hosts_onion[0]
    path    = "/testnet"
  }

  test {
    service = data.terraform_remote_state.liquid-mainnet.outputs.daemon_backend_service["liquid-mainnet"]
    host    = var.hosts_onion[0]
    path    = "/liquid"
  }

  test {
    service = data.terraform_remote_state.bitcoin-mainnet.outputs.daemon_backend_service["bitcoin-mainnet"]
    host    = var.hosts_onion[1]
    path    = "/"
  }

  test {
    service = data.terraform_remote_state.bitcoin-testnet.outputs.daemon_backend_service["bitcoin-testnet"]
    host    = var.hosts_onion[1]
    path    = "/testnet"
  }

  test {
    service = data.terraform_remote_state.liquid-mainnet.outputs.daemon_backend_service["liquid-mainnet"]
    host    = var.hosts_onion[1]
    path    = "/liquid"
  }

  test {
    service = google_compute_backend_bucket.onion_deadhole_backend[0].self_link
    host    = google_compute_global_address.onion-lb[0].address
    path    = "/"
  }
}

resource "google_compute_backend_bucket" "onion_deadhole_backend" {
  name        = "onion-deadhole-backend-bucket"
  description = "Unmatched hosts end up in this deadhole"
  bucket_name = google_storage_bucket.onion_deadhole[0].name
  enable_cdn  = false

  count = local.create_main
}

resource "google_storage_bucket" "onion_deadhole" {
  name     = "onion-deadhole-bucket"
  location = "EU"

  count = local.create_main
}
