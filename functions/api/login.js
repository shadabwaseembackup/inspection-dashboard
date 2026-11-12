const encoder = new TextEncoder();

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/g, "");
}

function safeEqual(a, b) {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) diff |= (left[i] || 0) ^ (right[i] || 0);
  return diff === 0;
}

export async function onRequestPost({ request, env }) {
  if (!env.DASHBOARD_PASSWORD || !env.SESSION_SECRET) {
    return new Response("Authentication is not configured.", { status: 503 });
  }

  const form = await request.formData();
  const password = String(form.get("password") || "");
  if (!safeEqual(password, env.DASHBOARD_PASSWORD)) {
    return Response.redirect(new URL("/login.html?error=1", request.url).toString(), 303);
  }

  const expires = String(Date.now() + 12 * 60 * 60 * 1000);
  const signature = await sign(expires, env.SESSION_SECRET);
  return new Response(null, {
    status: 303,
    headers: {
      "Location": "/",
      "Set-Cookie": `dashboard_session=${expires}.${signature}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=43200`,
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestGet() {
  return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
}
