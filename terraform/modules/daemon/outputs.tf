output "backend_service" {
  value = "${element(concat(google_compute_backend_service.daemon.*.self_link, list("")), 0)}"
}

output "service_account" {
  value = "${element(concat(google_service_account.daemon.*.email, list("")), 0)}"
}
