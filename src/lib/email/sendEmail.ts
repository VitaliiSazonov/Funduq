import { resend } from "./resend";
import type { ReactElement } from "react";

interface SendEmailParams {
  to: string;
  subject: string;
  react: ReactElement;
}

/**
 * Generic email wrapper — fire-and-forget safe.
 * Never throws — logs errors but won't break the main flow.
 */
export async function sendEmail({
  to,
  subject,
  react,
}: SendEmailParams): Promise<void> {
  const from = process.env.EMAIL_FROM || "noreply@funduq.com";

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      react,
    });

    if (error) {
      console.error("[Funduq Email] Failed to send:", error);
      return;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[Funduq Email] Sent "${subject}" to ${to} — ID: ${data?.id}`);
    }
  } catch (err) {
    console.error("[Funduq Email] Unexpected error:", err);
  }
}
