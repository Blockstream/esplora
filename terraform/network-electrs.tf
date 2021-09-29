# SSL Forwarding Rules
resource "google_compute_global_forwarding_rule" "mainnet-electrs-tls" {
  name        = "explorer-forwarding-rule-mainnet-electrs-tls"
  target      = google_compute_target_ssl_proxy.mainnet-electrs-tls-proxy[0].self_link
  port_range  = "700"
  ip_protocol = "TCP"
  ip_address  = google_compute_global_address.client-lb[0].address

  count = local.create_main
}

resource "google_compute_global_forwarding_rule" "testnet-electrs-tls" {
  name        = "explorer-forwarding-rule-testnet-electrs-tls"
  target      = google_compute_target_ssl_proxy.testnet-electrs-tls-proxy[0].self_link
  port_range  = "993"
  ip_protocol = "TCP"
  ip_address  = google_compute_global_address.client-lb[0].address

  count = local.create_main
}

resource "google_compute_global_forwarding_rule" "liquid-electrs-tls" {
  name        = "explorer-forwarding-rule-liquid-electrs-tls"
  target      = google_compute_target_ssl_proxy.liquid-electrs-tls-proxy[0].self_link
  port_range  = "995"
  ip_protocol = "TCP"
  ip_address  = google_compute_global_address.client-lb[0].address

  count = local.create_main
}

resource "google_compute_global_forwarding_rule" "liquidtestnet-electrs-tls" {
  name        = "explorer-forwarding-rule-liquidtestnet-electrs-tls"
  target      = google_compute_target_ssl_proxy.liquidtestnet-electrs-tls-proxy[0].self_link
  port_range  = "465"
  ip_protocol = "TCP"
  ip_address  = google_compute_global_address.client-lb[0].address

  count = local.create_main
}

# TCP Forwarding Rules
resource "google_compute_global_forwarding_rule" "mainnet-electrs-tcp" {
  name        = "explorer-forwarding-rule-mainnet-electrs-tcp"
  target      = google_compute_target_tcp_proxy.mainnet-electrs-tcp-proxy[0].self_link
  port_range  = "110"
  ip_protocol = "TCP"
  ip_address  = google_compute_global_address.client-lb[0].address

  count = local.create_main
}

resource "google_compute_global_forwarding_rule" "testnet-electrs-tcp" {
  name        = "explorer-forwarding-rule-testnet-electrs-tcp"
  target      = google_compute_target_tcp_proxy.testnet-electrs-tcp-proxy[0].self_link
  port_range  = "143"
  ip_protocol = "TCP"
  ip_address  = google_compute_global_address.client-lb[0].address

  count = local.create_main
}

resource "google_compute_global_forwarding_rule" "liquid-electrs-tcp" {
  name        = "explorer-forwarding-rule-liquid-electrs-tcp"
  target      = google_compute_target_tcp_proxy.liquid-electrs-tcp-proxy[0].self_link
  port_range  = "195"
  ip_protocol = "TCP"
  ip_address  = google_compute_global_address.client-lb[0].address

  count = local.create_main
}

resource "google_compute_global_forwarding_rule" "liquidtestnet-electrs-tcp" {
  name        = "explorer-forwarding-rule-liquidtestnet-electrs-tcp"
  target      = google_compute_target_tcp_proxy.liquidtestnet-electrs-tcp-proxy[0].self_link
  port_range  = "587"
  ip_protocol = "TCP"
  ip_address  = google_compute_global_address.client-lb[0].address

  count = local.create_main
}

#SSL Proxies
resource "google_compute_target_ssl_proxy" "mainnet-electrs-tls-proxy" {
  name             = "explorer-mainnet-electrs-tls-proxy"
  backend_service  = data.terraform_remote_state.bitcoin-mainnet.outputs.daemon_backend_service_electrs["bitcoin-mainnet"]
  ssl_certificates = [var.ssl_certs[2]]

  count = local.create_main
}

resource "google_compute_target_ssl_proxy" "testnet-electrs-tls-proxy" {
  name             = "explorer-testnet-electrs-tls-proxy"
  backend_service  = data.terraform_remote_state.bitcoin-testnet.outputs.daemon_backend_service_electrs["bitcoin-testnet"]
  ssl_certificates = [var.ssl_certs[2]]

  count = local.create_main
}

resource "google_compute_target_ssl_proxy" "liquid-electrs-tls-proxy" {
  name             = "explorer-liquid-electrs-tls-proxy"
  backend_service  = data.terraform_remote_state.liquid-mainnet.outputs.daemon_backend_service_electrs["liquid-mainnet"]
  ssl_certificates = [var.ssl_certs[2]]

  count = local.create_main
}

resource "google_compute_target_ssl_proxy" "liquidtestnet-electrs-tls-proxy" {
  name             = "explorer-liquidtestnet-electrs-tls-proxy"
  backend_service  = data.terraform_remote_state.liquid-testnet.outputs.daemon_backend_service_electrs["liquid-testnet"]
  ssl_certificates = [var.ssl_certs[2]]

  count = local.create_main
}

# TCP Proxies
resource "google_compute_target_tcp_proxy" "mainnet-electrs-tcp-proxy" {
  name            = "explorer-mainnet-electrs-tcp-proxy"
  backend_service = data.terraform_remote_state.bitcoin-mainnet.outputs.daemon_backend_service_electrs["bitcoin-mainnet"]

  count = local.create_main
}

resource "google_compute_target_tcp_proxy" "testnet-electrs-tcp-proxy" {
  name            = "explorer-testnet-electrs-tcp-proxy"
  backend_service = data.terraform_remote_state.bitcoin-testnet.outputs.daemon_backend_service_electrs["bitcoin-testnet"]

  count = local.create_main
}

resource "google_compute_target_tcp_proxy" "liquid-electrs-tcp-proxy" {
  name            = "explorer-liquid-electrs-tcp-proxy"
  backend_service = data.terraform_remote_state.liquid-mainnet.outputs.daemon_backend_service_electrs["liquid-mainnet"]

  count = local.create_main
}

resource "google_compute_target_tcp_proxy" "liquidtestnet-electrs-tcp-proxy" {
  name            = "explorer-liquidtestnet-electrs-tcp-proxy"
  backend_service = data.terraform_remote_state.liquid-testnet.outputs.daemon_backend_service_electrs["liquid-testnet"]

  count = local.create_main
}
