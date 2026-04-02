export async function onRequest(context: any) {
  const url = new URL(context.request.url)
  const key = url.searchParams.get("key")

  if (key !== context.env.TESTER_KEY) {
    return new Response("unauthorized key", { status: 403 })
  }

  return context.next()
}