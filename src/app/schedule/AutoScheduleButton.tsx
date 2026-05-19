"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { autoScheduleAction } from "../admin/actions";

export function AutoScheduleButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await autoScheduleAction();
          } finally {
            router.refresh();
          }
        })
      }
      className="px-4 py-2 bg-primary-fixed-dim text-[#050807] font-label-caps text-label-caps rounded font-bold uppercase hover:bg-primary-fixed transition-colors disabled:opacity-60 disabled:cursor-wait"
    >
      {pending ? "Scheduling…" : "⚡ Auto-schedule"}
    </button>
  );
}
