# Vault Setup Guide

This document describes the complete process for setting up HashiCorp Vault for the UniEventServer application.

## Overview

Vault is used to securely store Facebook page access tokens. The setup involves:
1. Initializing Vault
2. Unsealing Vault (after each restart)
3. Enabling the KV v2 secrets engine
4. Creating policies
5. Creating application tokens
6. Configuring the app with tokens

## Step 1: Initialize Vault

Run this command **once** when Vault is first started:

```powershell
docker compose exec -T vault vault operator init -key-shares=1 -key-threshold=1
```

**Output will contain:**
- **Unseal Key**: Used to unseal Vault after restarts (e.g., `xgZgqHCKHQTdb7opjuLRJIbZVCH7wM8PixyJZoVLrfo=`)
- **Initial Root Token**: Admin token for initial setup (e.g., `hvs.SRbbDj7M7ACIm7LTNcvLrGB9`)

**⚠️ SAVE THESE VALUES SECURELY** - You'll need them for all subsequent steps.

## Step 2: Unseal Vault

Required **every time** after `docker compose up` or container restart:

```powershell
docker compose exec -T vault vault operator unseal <UNSEAL_KEY>
```

Replace `<UNSEAL_KEY>` with your unseal key from Step 1.

Example:
```powershell
docker compose exec -T vault vault operator unseal xgZgqHCKHQTdb7opjuLRJIbZVCH7wM8PixyJZoVLrfo=
```

**Verify success:** Output should show `Sealed: false`

## Step 3: Enable KV v2 Secrets Engine

Run **once** with your root token:

```powershell
docker compose exec -T -e VAULT_TOKEN=<ROOT_TOKEN> vault vault secrets enable -path=secret kv-v2
```

Replace `<ROOT_TOKEN>` with your initial root token from Step 1.

Example:
```powershell
docker compose exec -T -e VAULT_TOKEN=hvs.SRbbDj7M7ACIm7LTNcvLrGB9 vault vault secrets enable -path=secret kv-v2
```

This creates the `/secret/` mount point where tokens will be stored.

## Step 4: Write the Application Policy

Run **once** with your root token:

```powershell
docker compose exec -T -e VAULT_TOKEN=<ROOT_TOKEN> vault vault policy write unievent-app /vault/config/policies/unievent-app.hcl
```

Example:
```powershell
docker compose exec -T -e VAULT_TOKEN=hvs.SRbbDj7M7ACIm7LTNcvLrGB9 vault vault policy write unievent-app /vault/config/policies/unievent-app.hcl
```

The policy file (`vault/config/policies/unievent-app.hcl`) defines what the app can do:
- Read/Write/Delete secrets at `secret/data/unievent/facebook/page_*`
- Read metadata for those paths

## Step 5: Create Application Token

Run **once** with your root token:

```powershell
docker compose exec -T -e VAULT_TOKEN=<ROOT_TOKEN> vault vault token create -policy=unievent-app -ttl=768h
```

Example:
```powershell
docker compose exec -T -e VAULT_TOKEN=hvs.SRbbDj7M7ACIm7LTNcvLrGB9 vault vault token create -policy=unievent-app -ttl=768h
```

**Output will contain:**
- **token**: The app token (e.g., `hvs.CAESIIvnhxMMwhWES3IjuIQsk2rby7_YZ4RDfk85f1aT_tplGh4KHGh2cy5oMEpuUEpocnhKejB5QTJpdzF6TkU3STc`)

⚠️ **Save this token** - it goes in `.env`

## Step 6: Configure Application

Update `.env` with the app token from Step 5:

```env
VAULT_TOKEN=hvs.CAESIIvnhxMMwhWES3IjuIQsk2rby7_YZ4RDfk85f1aT_tplGh4KHGh2cy5oMEpuUEpocnhKejB5QTJpdzF6TkU3STc
VAULT_UNSEAL_TOKEN=xgZgqHCKHQTdb7opjuLRJIbZVCH7wM8PixyJZoVLrfo=
```

Verify docker-compose.yml has:
```yaml
VAULT_ENABLED: ${VAULT_ENABLED:-true}
VAULT_URI: ${VAULT_URI:-http://vault:8200}
VAULT_TOKEN: ${VAULT_TOKEN:-}
VAULT_SECRET_PATH: ${VAULT_SECRET_PATH:-secret/data/unievent}
```

## Complete Workflow for Each Session

```powershell
# 1. Start containers
docker compose down
docker compose up -d --build

# 2. Unseal Vault (required after each up)
docker compose exec -T vault vault operator unseal xgZgqHCKHQTdb7opjuLRJIbZVCH7wM8PixyJZoVLrfo=

# 3. Test OAuth flow
# - Navigate to app
# - Click Facebook login
# - Complete OAuth callback
```

## Troubleshooting

### "Vault is sealed"
→ Run Step 2 (unseal command)

### "no handler for route secret/data/unievent/facebook/page_*"
→ Run Step 3 (enable kv-v2 secrets engine)

### "permission denied" when storing tokens
→ Make sure you're using the **app token** in `.env`, not the root token

### "permission denied" when writing policies
→ Make sure you're using the **root token** for admin operations, not the app token

## Secret Storage Location

Facebook page tokens are stored at:
```
secret/data/unievent/facebook/page_<PAGE_ID>
```

Example:
```
secret/data/unievent/facebook/page_829971186862222
```

## Token Expiration

The app token is valid for 768 hours (~32 days). To renew:

```powershell
docker compose exec -T -e VAULT_TOKEN=<ROOT_TOKEN> vault vault token create -policy=unievent-app -ttl=768h
```

Then update `.env` with the new token and restart the app.

## References

- Vault Documentation: https://www.vaultproject.io/docs
- Policy file: `vault/config/policies/unievent-app.hcl`
- App configuration: `docker-compose.yml` (services.app.environment)
