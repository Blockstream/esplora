output "service_account" {
  value = element(concat(google_service_account.electrum.*.email, list("")), 0)
}
