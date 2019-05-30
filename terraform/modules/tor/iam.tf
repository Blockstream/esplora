resource "google_service_account" "tor" {
  account_id   = var.name
  display_name = var.name

  count = var.create_resources
}

resource "google_project_iam_member" "tor" {
  project = var.project
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.tor[0].email}"

  count = var.create_resources
}

resource "google_kms_crypto_key_iam_binding" "crypto-key" {
  crypto_key_id = var.kms_key_link
  role          = "roles/cloudkms.cryptoKeyDecrypter"

  count = var.create_resources

  members = [
    "serviceAccount:${google_service_account.tor[0].email}",
  ]
}
