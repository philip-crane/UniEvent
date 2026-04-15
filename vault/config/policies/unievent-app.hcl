path "secret/data/unievent" {
  capabilities = ["read"]
}

path "secret/metadata/unievent" {
  capabilities = ["read"]
}

# Facebook integration - page token storage
path "secret/data/unievent/facebook/page_*" {
  capabilities = ["create", "read", "update"]
}

path "secret/metadata/unievent/facebook/page_*" {
  capabilities = ["read", "list"]
}

