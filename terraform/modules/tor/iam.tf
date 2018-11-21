resource "google_service_account" "tor" {
  account_id   = "${var.name}"
  display_name = "${var.name}"
}

resource "google_project_iam_member" "tor" {
  project = "${var.project}"
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.tor.email}"
}

resource "google_kms_crypto_key_iam_binding" "crypto-key" {
  crypto_key_id = "${var.kms_key_link.self_link}"
  role          = "roles/cloudkms.cryptoKeyDecrypter"

  members = [
    "serviceAccount:${google_service_account.tor.email}",
  ]
}
