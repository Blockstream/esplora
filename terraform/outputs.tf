output "prometheus_service_account" {
  value = module.prometheus.service_account
}

output "electrum_service_account" {
  value = module.electrum.service_account
}

output "daemon_backend_service" {
  value = {
    bitcoin-mainnet = module.bitcoin-mainnet.backend_service
    bitcoin-testnet = module.bitcoin-testnet.backend_service
    liquid-mainnet  = module.liquid-mainnet.backend_service
    liquid-testnet  = module.liquid-testnet.backend_service
  }
}

output "daemon_backend_service_electrs" {
  value = {
    bitcoin-mainnet = module.bitcoin-mainnet.backend_service_electrs
    bitcoin-testnet = module.bitcoin-testnet.backend_service_electrs
    liquid-mainnet  = module.liquid-mainnet.backend_service_electrs
    liquid-testnet  = module.liquid-testnet.backend_service_electrs
  }
}

output "service_accounts" {
  value = {
    bitcoin-mainnet = module.bitcoin-mainnet.service_account
    bitcoin-testnet = module.bitcoin-testnet.service_account
    liquid-mainnet  = module.liquid-mainnet.service_account
    liquid-testnet  = module.liquid-testnet.service_account
  }
}
