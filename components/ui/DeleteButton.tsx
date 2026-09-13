"use client";

import { useState } from "react";
import { Trash } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "./Button";

/** Two-step delete: first tap asks "really?", second tap deletes. */
export function DeleteButton({ onConfirm, loading, size = "md" }: { onConfirm: () => void; loading?: boolean; size?: "sm" | "md" }) {
  const { t } = useI18n();
  const [arm, setArm] = useState(false);
  return (
    <Button
      variant="danger"
      size={size}
      loading={loading}
      onClick={() => {
        if (arm) onConfirm();
        else {
          setArm(true);
          setTimeout(() => setArm(false), 4000);
        }
      }}
    >
      <Trash className="h-4 w-4" />
      {arm ? t("common.reallyDelete") : t("common.delete")}
    </Button>
  );
}
