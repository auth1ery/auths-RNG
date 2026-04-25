export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (request.method === "POST") {
    const url = new URL(request.url);
    const sid = url.searchParams.get("sid");
    if (!sid) return new Response("missing sid", { status: 400 });

    // store session with 3 minute ttl (auto-expires if heartbeat stops)
    await env.CCU_KV.put(`session:${sid}`, "1", { expirationTtl: 180 });
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  // Poll: GET /api/ccu
  if (request.method === "GET") {
    const list = await env.CCU_KV.list({ prefix: "session:" });
    return new Response(JSON.stringify({ ccu: list.keys.length }), { headers });
  }

  return new Response("Method not allowed", { status: 405 });
} // for da webgamedb!!!!!