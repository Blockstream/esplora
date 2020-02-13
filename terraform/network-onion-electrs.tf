# TCP Forwarding Rules
resource "google_compute_global_forwarding_rule" "mainnet-electrs-tcp-onion" {
  name        = "explorer-forwarding-rule-mainnet-electrs-tcp-onion"
  target      = google_compute_target_tcp_proxy.mainnet-electrs-tcp-proxy-onion[0].self_link
  port_range  = "110"
  ip_protocol = "TCP"
  ip_address  = google_compute_global_address.onion-lb[0].address

  count = local.create_main
}

resource "google_compute_global_forwarding_rule" "testnet-electrs-tcp-onion" {
  name        = "explorer-forwarding-rule-testnet-electrs-tcp-onion"
  target      = google_compute_target_tcp_proxy.testnet-electrs-tcp-proxy-onion[0].self_link
  port_range  = "143"
  ip_protocol = "TCP"
  ip_address  = google_compute_global_address.onion-lb[0].address

  count = local.create_main
}

resource "google_compute_global_forwarding_rule" "liquid-electrs-tcp-onion" {
  name        = "explorer-forwarding-rule-liquid-electrs-tcp-onion"
  target      = google_compute_target_tcp_proxy.liquid-electrs-tcp-proxy-onion[0].self_link
  port_range  = "195"
  ip_protocol = "TCP"
  ip_address  = google_compute_global_address.onion-lb[0].address

  count = local.create_main
}

# TCP Proxies
resource "google_compute_target_tcp_proxy" "mainnet-electrs-tcp-proxy-onion" {
  name            = "explorer-mainnet-electrs-tcp-proxy-onion"
  backend_service = data.terraform_remote_state.bitcoin-mainnet.outputs.daemon_backend_service_electrs["bitcoin-mainnet"]

  count = local.create_main
}

resource "google_compute_target_tcp_proxy" "testnet-electrs-tcp-proxy-onion" {
  name            = "explorer-testnet-electrs-tcp-proxy-onion"
  backend_service = data.terraform_remote_state.bitcoin-testnet.outputs.daemon_backend_service_electrs["bitcoin-testnet"]

  count = local.create_main
}

resource "google_compute_target_tcp_proxy" "liquid-electrs-tcp-proxy-onion" {
  name            = "explorer-liquid-electrs-tcp-proxy-onion"
  backend_service = data.terraform_remote_state.liquid-mainnet.outputs.daemon_backend_service_electrs["liquid-mainnet"]

  count = local.create_main
}
