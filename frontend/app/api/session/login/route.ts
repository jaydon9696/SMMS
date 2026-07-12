import { cookies } from "next/headers";

const backendUrl =
  process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

export async function POST(request: Request) {
  const credentials = (await request.json()) as {
    email?: string;
    password?: string;
  };
  const form = new URLSearchParams({
    username: credentials.email ?? "",
    password: credentials.password ?? "",
  });
  const response = await fetch(`${backendUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
    cache: "no-store",
  });
  const payload = (await response.json()) as {
    data?: { access_token?: string };
    error?: { message?: string };
  };
  if (!response.ok || !payload.data?.access_token) {
    return Response.json(
      { error: { message: payload.error?.message ?? "Unable to sign in" } },
      { status: response.status },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set("smms_token", payload.data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
  return Response.json({ data: { authenticated: true } });
}
