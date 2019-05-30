resource "google_compute_global_address" "client-lb" {
  name    = "explorer-address-client-lb"
  project = var.project

  count = local.create_main
}

resource "google_compute_global_forwarding_rule" "rule-https" {
  name        = "explorer-https-forwarding-rule"
  target      = google_compute_target_https_proxy.https-proxy[0].self_link
  port_range  = "443"
  ip_protocol = "TCP"
  ip_address  = google_compute_global_address.client-lb[0].address

  count = local.create_main
}

resource "google_compute_global_forwarding_rule" "rule-http" {
  name        = "explorer-http-forwarding-rule"
  target      = google_compute_target_http_proxy.http-proxy[0].self_link
  port_range  = "80"
  ip_protocol = "TCP"
  ip_address  = google_compute_global_address.client-lb[0].address

  count = local.create_main
}

resource "google_compute_target_http_proxy" "http-proxy" {
  name    = "explorer-http-proxy"
  url_map = google_compute_url_map.http-proxy[0].self_link

  count = local.create_main
}

resource "google_compute_url_map" "http-proxy" {
  name            = "explorer-http-urlmap"
  default_service = data.terraform_remote_state.bitcoin-mainnet.outputs.http_backend_service["bitcoin-mainnet"]

  count = local.create_main

  host_rule {
    hosts        = var.hosts
    path_matcher = "allpaths"
  }

  path_matcher {
    name            = "allpaths"
    default_service = data.terraform_remote_state.bitcoin-mainnet.outputs.http_backend_service["bitcoin-mainnet"]

    path_rule {
      paths   = ["/*"]
      service = data.terraform_remote_state.bitcoin-mainnet.outputs.http_backend_service["bitcoin-mainnet"]
    }

    path_rule {
      paths   = ["/testnet", "/testnet/*"]
      service = data.terraform_remote_state.bitcoin-testnet.outputs.http_backend_service["bitcoin-testnet"]
    }

    path_rule {
      paths   = ["/liquid", "/liquid/*"]
      service = data.terraform_remote_state.liquid-mainnet.outputs.http_backend_service["liquid-mainnet"]
    }
  }

  test {
    service = data.terraform_remote_state.bitcoin-mainnet.outputs.http_backend_service["bitcoin-mainnet"]
    host    = var.hosts[0]
    path    = "/"
  }

  test {
    service = data.terraform_remote_state.bitcoin-testnet.outputs.http_backend_service["bitcoin-testnet"]
    host    = var.hosts[0]
    path    = "/testnet"
  }

  test {
    service = data.terraform_remote_state.liquid-mainnet.outputs.http_backend_service["liquid-mainnet"]
    host    = var.hosts[0]
    path    = "/liquid"
  }
}

resource "google_compute_target_https_proxy" "https-proxy" {
  name             = "explorer-https-proxy"
  url_map          = google_compute_url_map.https-proxy[0].self_link
  ssl_certificates = var.ssl_certs

  count = local.create_main
}

resource "google_compute_url_map" "https-proxy" {
  name            = "explorer-https-urlmap"
  default_service = data.terraform_remote_state.bitcoin-mainnet.outputs.daemon_backend_service["bitcoin-mainnet"]

  count = local.create_main

  host_rule {
    hosts        = var.hosts
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
    host    = var.hosts[0]
    path    = "/"
  }

  test {
    service = data.terraform_remote_state.bitcoin-testnet.outputs.daemon_backend_service["bitcoin-testnet"]
    host    = var.hosts[0]
    path    = "/testnet"
  }

  test {
    service = data.terraform_remote_state.liquid-mainnet.outputs.daemon_backend_service["liquid-mainnet"]
    host    = var.hosts[0]
    path    = "/liquid"
  }
}
