resource "google_kms_key_ring" "esplora-key-ring" {
  project  = var.project
  name     = "esplora-store-keyring"
  location = var.kms_location

  count = local.create_main
}

resource "google_kms_crypto_key" "esplora-crypto-key" {
  name     = "esplora-store-crypto-key"
  key_ring = google_kms_key_ring.esplora-key-ring[0].id

  count = local.create_main
}
