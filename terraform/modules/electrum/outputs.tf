output "service_account" {
  value = element(concat(google_service_account.electrum.*.email, tolist([""])), 0)
}
