# Free AI backend (Cloudflare Workers AI)

This is an optional backend for the Inspection Dashboard's Intelligence tab. It is intentionally separate from GitHub Pages and does not change the Google Sheets ingestion.

## Cost boundary (important)

- Keep the Cloudflare account on **Workers Free**. Do not upgrade to Workers Paid and do not add prepaid AI Gateway credits for this project.
- Workers AI currently includes **10,000 Neurons per day at no charge** on Workers Free. The allowance resets daily at 00:00 UTC.
- This Worker uses the Cloudflare-hosted model `@cf/zai-org/glm-4.7-flash`, which is available on Workers Free. Model inference consumes Neurons from the daily allocation.
- When the daily free allocation is exhausted, Workers Free requests fail until reset. This Worker returns a temporary-unavailable response and does not switch models, call an external provider, use AI Gateway credits, or attempt a paid fallback.
- The allowance is finite, not unlimited free usage. Monitor Workers AI Neuron usage in the Cloudflare dashboard. Cloudflare may change model availability and pricing; re-check the official pricing page before changing models.

## Privacy and safety

- The endpoint accepts aggregate counts and short category/substation summaries only. It deliberately drops arbitrary fields and does not accept individual inspection rows, asset IDs, photos, employee names, or customer information.
- Cloudflare Turnstile verification is required on every AI request.
- CORS is restricted to the GitHub Pages origin. CORS is not authentication; Turnstile is an anti-abuse gate, not employee identity verification.
- Do not use this public beta for confidential, customer-identifiable, or safety-critical decision-making. Engineering decisions must be verified against source records.
- No request body or model answer is logged by this Worker.

## Deploy (Workers Free)

1. Keep the account on the Cloudflare Workers Free plan and enable Workers AI.
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

## Official references

- Workers AI pricing and daily free allocation: https://developers.cloudflare.com/workers-ai/platform/pricing/
- GLM-4.7-Flash model details: https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/
- Workers Free pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Turnstile: https://developers.cloudflare.com/turnstile/
