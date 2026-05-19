"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button for the team form that surfaces the pending state of its
 * parent <form action={updateTeamAction}>.
 */
export function SaveTeamButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-end mt-2 px-4 py-2 bg-primary-fixed-dim text-[#050807] font-label-caps text-label-caps rounded font-bold uppercase hover:bg-primary-fixed transition-colors disabled:opacity-60 disabled:cursor-wait"
    >
      {pending ? "Saving…" : "Save team"}
    </button>
  );
}
