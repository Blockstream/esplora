output "prometheus_service_account" {
  value = module.prometheus.service_account
}

output "daemon_backend_service" {
  value = {
    bitcoin-mainnet = module.bitcoin-mainnet.backend_service
    bitcoin-testnet = module.bitcoin-testnet.backend_service
    liquid-mainnet  = module.liquid-mainnet.backend_service
  }
}

output "http_backend_service" {
  value = {
    bitcoin-mainnet = module.bitcoin-mainnet-http.backend_service
    bitcoin-testnet = module.bitcoin-testnet-http.backend_service
    liquid-mainnet  = module.liquid-mainnet-http.backend_service
  }
}

output "service_accounts" {
  value = {
    bitcoin-mainnet = module.bitcoin-mainnet.service_account
    bitcoin-testnet = module.bitcoin-testnet.service_account
    liquid-mainnet  = module.liquid-mainnet.service_account
  }
}
