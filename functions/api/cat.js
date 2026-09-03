export async function onRequestGet(context) {
	const key = context.env.CAT_API_KEY;
	if (!key) return new Response(JSON.stringify({ error: 'missing key' }), { status: 500 });

	const res = await fetch('https://api.thecatapi.com/v1/images/search', {
		headers: { 'x-api-key': key },
	});
	if (!res.ok) return new Response(JSON.stringify({ error: 'upstream failed' }), { status: 502 });

	const data = await res.json();
	return new Response(JSON.stringify({ url: data[0].url }), {
		headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
	});
}
