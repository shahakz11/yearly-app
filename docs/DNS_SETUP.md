# Spaceship DNS Configuration Cheatsheet for Yearly (`yearly.click`)

This guide provides the exact DNS records and configuration steps required to connect your custom domain **`yearly.click`** registered on Spaceship (`spaceship.com`) to GitHub Pages serving from the `docs/` folder.

---

## 1. Quick Reference: Required DNS Records

| Record Type | Host / Name | Value / Target | TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` | `185.199.108.153` | Automatic / 1 Hour | GitHub Pages Apex IP 1 |
| **A** | `@` | `185.199.109.153` | Automatic / 1 Hour | GitHub Pages Apex IP 2 |
| **A** | `@` | `185.199.110.153` | Automatic / 1 Hour | GitHub Pages Apex IP 3 |
| **A** | `@` | `185.199.111.153` | Automatic / 1 Hour | GitHub Pages Apex IP 4 |
| **CNAME** | `www` | `yearly.click.` | Automatic / 1 Hour | Subdomain Canonical Redirect |

*Note: Alternatively, the `www` CNAME record can point to your GitHub username organization domain (e.g., `<username>.github.io.`).*

---

## 2. Step-by-Step Instructions in Spaceship

### Step 1: Log in to Spaceship
1. Navigate to [Spaceship.com](https://www.spaceship.com) and log into your account dashboard.
2. Under **Domains** (or **Domain Portfolio**), click on **`yearly.click`**.

### Step 2: Open Advanced DNS Settings
1. Click on the **DNS** or **Advanced DNS** tab.
2. Ensure you are using **Spaceship BasicDNS** (or Spaceship standard nameservers).

### Step 3: Remove Default / Parking Records
1. Locate any pre-existing default parking records:
   - Any default `A` records pointing to parking IP addresses (e.g. `162.255.119.x` or similar).
   - Any default `CNAME` records for `www` pointing to `parking...`
2. Delete these conflicting records.

### Step 4: Add the 4 GitHub Pages Apex A Records
Click **Add Record** (or **New Record**) and create four separate `A` records:

1. **First A Record**:
   - Type: `A`
   - Host / Name: `@` (or leave blank if Spaceship uses blank for root)
   - Value / IP Address: `185.199.108.153`
   - TTL: `Auto` (or `3600`)

2. **Second A Record**:
   - Type: `A`
   - Host / Name: `@`
   - Value / IP Address: `185.199.109.153`
   - TTL: `Auto` (or `3600`)

3. **Third A Record**:
   - Type: `A`
   - Host / Name: `@`
   - Value / IP Address: `185.199.110.153`
   - TTL: `Auto` (or `3600`)

4. **Fourth A Record**:
   - Type: `A`
   - Host / Name: `@`
   - Value / IP Address: `185.199.111.153`
   - TTL: `Auto` (or `3600`)

### Step 5: Add the Subdomain CNAME Record
Click **Add Record** to create the `www` redirect:
- Type: `CNAME`
- Host / Name: `www`
- Value / Target: `yearly.click.`
- TTL: `Auto` (or `3600`)

### Step 6: Save All Changes
Click **Save All Changes** to apply the configuration.

---

## 3. GitHub Pages Repository Configuration

1. In your GitHub repository, navigate to **Settings** > **Pages**.
2. **Build and deployment**:
   - Source: `Deploy from a branch`
   - Branch: `main` (or your default branch), folder: `/docs`
   - Click **Save**.
3. **Custom domain**:
   - In the Custom domain field, enter `yearly.click`.
   - Click **Save**.
   - GitHub Pages will verify DNS records and ensure the `CNAME` file in `/docs/CNAME` matches `yearly.click`.
4. **Enforce HTTPS**:
   - Once DNS propagation check passes (usually 5–15 minutes), check the **Enforce HTTPS** box.
   - GitHub will automatically provision a free Let's Encrypt TLS/SSL certificate.

---

## 4. Verification & Troubleshooting

### Check DNS Propagation via Terminal
Run the following commands to check if the A records and CNAME have propagated:

```bash
# Check Apex A records (should return the 4 GitHub IPs)
dig +short yearly.click A

# Check www CNAME record
dig +short www.yearly.click CNAME

# Query Google Public DNS directly
dig @8.8.8.8 +short yearly.click A
```

### Expected Output
```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

---

## 5. Contact & Support

For issues with Spaceship DNS management or GitHub Pages domain verification:
- **Yearly Support:** `support@yearly.click`
- **Spaceship Support:** [help.spaceship.com](https://help.spaceship.com)
