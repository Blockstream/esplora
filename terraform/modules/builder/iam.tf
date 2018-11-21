resource "google_service_account" "builder" {
  account_id   = "builder-${var.name}"
  display_name = "builder ${var.daemon} ${var.network}"

  count = "${var.create_resources}"
}

resource "google_project_iam_member" "builder" {
  project = "${var.project}"
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.builder.email}"

  count = "${var.create_resources}"
}
