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
- The dashboard HTML is proxied from the repository's `main/index.html`; its existing Google Sheets integration and external libraries are not rewritten.

## One-time Cloudflare setup

Run these commands from the `ai-worker` directory after merging the PR:

```sh
npx wrangler secret put DASHBOARD_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler secret put TURNSTILE_SECRET
npx wrangler deploy
```

Use a strong shared password (at least 16 characters). For `SESSION_SECRET`, generate a random value, for example:

```sh
openssl rand -hex 32
```

Paste that generated value when Wrangler prompts for `SESSION_SECRET`. Never put any of these values in GitHub, the HTML, or this README. Re-enter the existing Turnstile secret when prompted if Wrangler asks; it is not stored in this repository.

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
6. Verify Google Sheets refresh, FP/SP/DT views, exports, and the Intelligence tab. Check `/ask` only after signing in.
7. **Only after all checks pass**, disable GitHub Pages in the repository's Settings → Pages. This is essential: leaving the old `github.io` website published would let visitors bypass the Worker password. The new private-access URL is the Worker URL above.

## Important data-access limitation

The dashboard uses a Google Sheet that is currently shared for browser-side CSV reading. The Worker password protects the dashboard website, but it does **not** make a separately public Google Sheet private. Anyone who already has that sheet URL may still be able to read it. If the sheet must also be confidential, its sharing and data-delivery architecture must be secured separately.

## Existing AI endpoint

- `GET /health`: health/configuration status.
- `POST /ask`: requires a valid dashboard session and a Turnstile token; accepts aggregate-only inspection summaries.
- No individual asset records, employee/customer details, or paid AI fallback are introduced.

## Official references

- Workers AI pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Workers Free pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Turnstile: https://developers.cloudflare.com/turnstile/
