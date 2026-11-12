const encoder = new TextEncoder();

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/g, "");
}

async function validSession(request, secret) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\\s*)dashboard_session=([^;]+)/);
  if (!match) return false;
  const [expires, signature] = decodeURIComponent(match[1]).split(".");
  if (!expires || !signature || !/^\\d+$/.test(expires) || Number(expires) <= Date.now()) return false;
  return (await sign(expires, secret)) === signature;
}

export async function onRequest(context) {
  const { request, env } = context;
  const path = new URL(request.url).pathname;

  // The login screen and authentication endpoints must remain reachable.
  if (path === "/login.html" || path === "/api/login" || path === "/api/logout") {
    return context.next();
  }

  if (!env.DASHBOARD_PASSWORD || !env.SESSION_SECRET) {
    return new Response("Dashboard authentication is not configured. Set DASHBOARD_PASSWORD and SESSION_SECRET in Cloudflare Pages settings.", {
      status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
    });
  }

  if (!(await validSession(request, env.SESSION_SECRET))) {
    return Response.redirect(new URL("/login.html", request.url).toString(), 302);
  }

  return context.next();
}
