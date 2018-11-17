output "service_account" {
  value = "${element(concat(google_service_account.prometheus.*.email, list("")), 0)}"
}
