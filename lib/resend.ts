import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
export const FROM = process.env.RESEND_FROM;

if (!apiKey) {
  throw new Error("RESEND_API_KEY no está configurada.");
}

export const resend = new Resend(apiKey);
