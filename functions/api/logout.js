export async function onRequest({ request }) {
  return new Response(null, {
    status: 303,
    headers: {
      "Location": "/login.html",
      "Set-Cookie": "dashboard_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
      "Cache-Control": "no-store"
    }
  });
}
