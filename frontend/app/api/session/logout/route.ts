import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("smms_token");
  return Response.json({ data: { authenticated: false } });
}
