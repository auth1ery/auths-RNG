export async function onRequestPost({ request, env }) {
  const { token } = await request.json();

  if (!token) {
    return Response.json({ success: false, error: "no token" }, { status: 400 });
  }

  const formData = new FormData();
  formData.append("secret", env.TURNSTILE_SECRET);
  formData.append("response", token);

  const result = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await result.json();

  if (!data.success) {
    return Response.json(
      { success: false, error: "invalid captcha" },
      { status: 403 }
    );
  }

  return Response.json({ success: true });
}
