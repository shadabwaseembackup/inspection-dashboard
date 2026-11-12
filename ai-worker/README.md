# Cloudflare Worker: password-protected dashboard + free AI backend

The existing Worker named `waseem` now acts as the dashboard gateway and retains the existing optional AI endpoint. The dashboard is served through the Worker from the repository's `main/index.html`; the original GitHub Pages URL must be disabled after the Worker is deployed and verified, otherwise it remains a public bypass.

## Cost boundary

- Keep the Cloudflare account on **Workers Free**. Do not upgrade to Workers Paid or add paid AI credits.
- The AI endpoint remains on `@cf/zai-org/glm-4.7-flash`, aggregate-only input, and Turnstile verification.
- Workers AI free allocation is finite and subject to Cloudflare's current limits; there is no paid fallback in this code.
- The password gateway, signed cookie sessions, and static HTML proxy use the existing Worker. No additional service or custom domain is required.

## What the gateway does

- Serves the dashboard only at `https://waseem.shadab-waseem.workers.dev/` after authentication.
- Requires the shared password plus a Cloudflare Turnstile challenge at login.
- Issues a signed, HttpOnly, Secure, SameSite=Lax cookie with a 12-hour expiry. The password and signing key are server-side Worker secrets.
- Protects `/ask` with the same authenticated session; `/health` remains a non-sensitive health check.
- Keeps the existing aggregate-only AI prompt and free-tier safeguards.
- The dashboard HTML is proxied from the repository's `main/index.html`.
- FP/SP and DT data are fetched server-to-server by this Worker using a read-only Google Sheets API scope. The browser never contacts Google Sheets directly and no public link-sharing is required.

## One-time Cloudflare setup

Run these commands from the `ai-worker` directory after merging the PR:

```sh
npx wrangler secret put DASHBOARD_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON
npx wrangler deploy
```

Use a strong shared password (at least 16 characters). For `SESSION_SECRET`, generate a random value, for example:

```sh
openssl rand -hex 32
```

Paste that generated value when Wrangler prompts for `SESSION_SECRET`. Never put any of these values in GitHub, the HTML, or this README. Re-enter the existing Turnstile secret when prompted if Wrangler asks; it is not stored in this repository. For `GOOGLE_SERVICE_ACCOUNT_JSON`, paste the complete JSON credential already used by the Vercel project (do not commit it to GitHub). The JSON must contain `client_email` and `private_key`. The service-account email in `client_email` must have at least Viewer access to the one inspection spreadsheet, and the Google Sheets API must be enabled in that service account's Google Cloud project.

## Turnstile hostname

In the existing Cloudflare Turnstile widget, add this hostname to its allowed hostnames:

`waseem.shadab-waseem.workers.dev`

Keep the existing `shadabwaseembackup.github.io` hostname temporarily until the Worker login and AI verification are tested. The existing public site key is already used by the dashboard and the gateway login page.

## Safe cutover sequence

1. Merge this change and deploy the existing `waseem` Worker.
2. Add the Worker hostname to the existing Turnstile widget.
3. Set the three Worker secrets above. Keep the same Turnstile secret already used by `/ask`.
4. Open `https://waseem.shadab-waseem.workers.dev/health`; verify that `dashboardAuth` and `ai` are true.
5. Open `https://waseem.shadab-waseem.workers.dev/` in a private/incognito browser. Confirm the login screen appears, a wrong password is rejected, and the correct password opens the existing dashboard.
6. Verify the `/sheets?tab=fpsp` and `/sheets?tab=dt` endpoints only while signed in; then verify Google Sheets refresh, FP/SP/DT views, exports, and the Intelligence tab. Check `/ask` only after signing in.
7. **Only after all checks pass**, disable GitHub Pages in the repository's Settings → Pages. This is essential: leaving the old `github.io` website published would let visitors bypass the Worker password. The new private-access URL is the Worker URL above.

## Important data-access limitation

The spreadsheet can remain **Restricted**. The Worker uses its service-account credential and a read-only Sheets API scope to retrieve only the two configured tabs. Grant Viewer access to the service-account email shown in the JSON credential; do not enable Anyone-with-the-link sharing. The Worker session is required for data delivery.

## Existing AI endpoint

- `GET /health`: health/configuration status.
- `POST /ask`: requires a valid dashboard session and a Turnstile token; accepts aggregate-only inspection summaries.
- No individual asset records, employee/customer details, or paid AI fallback are introduced.

## Official references

- Workers AI pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Workers Free pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Turnstile: https://developers.cloudflare.com/turnstile/
