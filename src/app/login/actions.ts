"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export type LoginState = { error?: string };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/admin");

  const adminUser = process.env.ADMIN_USERNAME ?? "admin";
  const adminPass = process.env.ADMIN_PASSWORD ?? "niteco123";

  if (username !== adminUser || password !== adminPass) {
    return { error: "Invalid credentials." };
  }

  const session = await getSession();
  session.admin = true;
  session.username = username;
  await session.save();
  redirect(from || "/admin");
}

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/");
}
