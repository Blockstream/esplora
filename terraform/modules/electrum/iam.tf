resource "google_service_account" "electrum" {
  account_id   = "electrum-${var.name}"
  display_name = "electrum-${var.name}"

  count = var.create_resources
}

resource "google_project_iam_member" "electrum" {
  project = var.project
  role    = "roles/viewer"
  member  = "serviceAccount:${google_service_account.electrum[0].email}"

  count = var.create_resources
}
