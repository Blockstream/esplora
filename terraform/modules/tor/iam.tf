resource "google_service_account" "tor" {
  account_id   = "${var.name}"
  display_name = "${var.name}"
}

resource "google_project_iam_member" "tor" {
  project = "${var.project}"
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.tor.email}"
}
