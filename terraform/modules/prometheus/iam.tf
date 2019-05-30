resource "google_service_account" "prometheus" {
  account_id   = "prometheus-${var.name}"
  display_name = "prometheus-${var.name}"

  count = var.create_resources
}

resource "google_project_iam_member" "prometheus" {
  project = var.project
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.prometheus[0].email}"

  count = var.create_resources
}
