export async function onRequest(context: any) {
  const url = new URL(context.request.url)
  const password = url.searchParams.get("key")

  if (password !== context.env.TESTER_KEY) {
    return new Response("unauthorized...", { status: 401 })
  }

  return context.next()
}