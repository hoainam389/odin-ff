"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initial: LoginState = {};

export function LoginForm({ from }: { from: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="from" value={from} />
      <label className="flex flex-col gap-1">
        <span className="text-label-caps font-label-caps text-on-surface-variant">USERNAME</span>
        <input
          name="username"
          required
          autoComplete="username"
          className="bg-[#071411] border border-[#1F4D3F] focus:border-primary-fixed-dim rounded p-3 font-body-md text-on-surface outline-none transition-colors"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-label-caps font-label-caps text-on-surface-variant">PASSCODE</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="bg-[#071411] border border-[#1F4D3F] focus:border-primary-fixed-dim rounded p-3 font-body-md text-on-surface outline-none transition-colors"
        />
      </label>
      {state.error && (
        <div className="text-error text-body-sm border border-error-container bg-error-container/30 rounded p-2">
          {state.error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-primary-fixed-dim text-[#050807] font-label-caps text-label-caps rounded p-3 font-bold uppercase hover:bg-primary-fixed transition-colors disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Enter Control Room"}
      </button>
    </form>
  );
}
