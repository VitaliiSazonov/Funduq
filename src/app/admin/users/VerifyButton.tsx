"use client";

import { useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { verifyUserAdminAction } from "./verifyAction";
import { useRouter } from "next/navigation";

export function VerifyButton({
  userId,
  isVerified,
}: {
  userId: string;
  isVerified: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (isVerified) {
    return null;
  }

  return (
    <button
      onClick={() => {
        startTransition(async () => {
          await verifyUserAdminAction(userId);
          router.refresh();
        });
      }}
      disabled={isPending}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        background: "rgba(34, 197, 94, 0.1)",
        color: "#22c55e",
        border: "1px solid rgba(34, 197, 94, 0.2)",
        cursor: isPending ? "not-allowed" : "pointer",
        opacity: isPending ? 0.7 : 1,
        transition: "all 0.2s",
      }}
    >
      {isPending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Check size={14} />
      )}
      Verify
    </button>
  );
}
