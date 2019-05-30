resource "google_service_account" "http" {
  account_id   = "http-${var.name}"
  display_name = "http-${var.name}"

  count = var.create_resources
}

resource "google_project_iam_member" "http" {
  project = var.project
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.http[0].email}"

  count = var.create_resources
}
