output "backend_service" {
  value = element(concat(google_compute_backend_service.daemon.*.self_link, tolist([""])), 0)
}

output "backend_service_electrs" {
  value = element(concat(google_compute_backend_service.daemon-electrs.*.self_link, tolist([""])), 0)
}

output "service_account" {
  value = element(concat(google_service_account.daemon.*.email, tolist([""])), 0)
}
