# Free AI backend (Cloudflare Workers AI)

This is an optional backend for the Inspection Dashboard's Intelligence tab. It is intentionally separate from GitHub Pages and does not change the Google Sheets ingestion.

## Cost design

- Cloudflare Workers Free currently includes 100,000 Worker requests/day.
- Workers AI currently includes 10,000 Neurons/day at no charge.
- When the free AI allocation is exhausted, the endpoint returns a temporary-unavailable response. It does not switch to a paid plan or silently incur usage charges.
- Free quotas and model availability can change; check the linked official pricing before relying on it.

## Privacy and safety

- The endpoint accepts aggregate counts and short category/substation summaries only. It deliberately drops arbitrary fields and does not accept individual inspection rows, asset IDs, photos, employee names, or customer information.
- Cloudflare Turnstile verification is required on every AI request.
- CORS is restricted to the GitHub Pages origin. CORS is not authentication; Turnstile is an anti-abuse gate, not employee identity verification.
- Do not use this public beta for confidential, customer-identifiable, or safety-critical decision-making. Engineering decisions must be verified against source records.
- No request body or model answer is logged by this Worker.

## Deploy (free tier)

1. Create/sign in to a Cloudflare account and enable Workers AI on the Free plan.
2. In Cloudflare Turnstile, create a widget for `shadabwaseembackup.github.io` and choose Managed mode.
3. From the `ai-worker` folder, deploy with Wrangler:
   ```sh
   npx wrangler deploy
   ```
4. Add the Turnstile secret as a Worker secret (never commit it):
   ```sh
   npx wrangler secret put TURNSTILE_SECRET
   ```
5. Check `https://<worker-name>.<account-subdomain>.workers.dev/health`.

The dashboard front end is not yet connected to this endpoint. That connection requires the deployed Worker URL and the Turnstile public site key. Keep the AI panel's existing local analytics as the fallback.

## Free-tier references

- Workers: https://developers.cloudflare.com/workers/platform/pricing/
- Workers AI: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Turnstile: https://developers.cloudflare.com/turnstile/
