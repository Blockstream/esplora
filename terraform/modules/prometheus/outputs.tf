output "service_account" {
  value = google_service_account.prometheus.email
}
