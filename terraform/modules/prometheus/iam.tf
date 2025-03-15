resource "google_service_account" "prometheus" {
  account_id   = "prometheus-${var.name}"
  display_name = "prometheus-${var.name}"
}

resource "google_project_iam_member" "prometheus" {
  project = var.project
  role    = "roles/viewer"
  member  = "serviceAccount:${google_service_account.prometheus.email}"
}
