import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export const DEVICE_ID_COOKIE = "device_id";
export const STD_AUTH_COOKIE = "std_auth_user";
export const DEVICE_ID_MAX_AGE = 365 * 24 * 60 * 60;
export const STD_AUTH_MAX_AGE = 5 * 60;

export async function getOrCreateDeviceId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(DEVICE_ID_COOKIE)?.value;
  if (existing) return existing;

  const deviceId = randomBytes(16).toString("hex");
  store.set(DEVICE_ID_COOKIE, deviceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DEVICE_ID_MAX_AGE,
    path: "/",
  });
  return deviceId;
}

export async function getDeviceId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(DEVICE_ID_COOKIE)?.value;
}

export async function setStdAuthPhone(phone: string): Promise<void> {
  const store = await cookies();
  store.set(STD_AUTH_COOKIE, phone, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STD_AUTH_MAX_AGE,
    path: "/",
  });
}

export async function getStdAuthPhone(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(STD_AUTH_COOKIE)?.value;
}

export async function clearStdAuthPhone(): Promise<void> {
  const store = await cookies();
  store.delete(STD_AUTH_COOKIE);
}
