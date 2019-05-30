resource "google_service_account" "daemon" {
  account_id   = var.name
  display_name = "${var.daemon} ${var.network}"

  count = var.create_resources
}

resource "google_project_iam_member" "daemon" {
  project = var.project
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.daemon[0].email}"

  count = var.create_resources
}
