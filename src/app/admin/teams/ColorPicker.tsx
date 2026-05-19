"use client";

import { useState } from "react";

const COLOR_PALETTE = [
  "#00d4ff", "#7c3aed", "#22c55e", "#f97316", "#ef4444",
  "#fbbf24", "#ec4899", "#06b6d4", "#8b5cf6", "#10b981",
  "#f43f5e", "#84cc16", "#6366f1", "#14b8a6", "#fb923c",
];

type Props = {
  /** Hidden form input name. */
  name: string;
  /** Initial value (hex string). */
  defaultValue: string;
};

/**
 * Mirrors EmojiPicker UX: a swatch button opens a popover grid of preset colors.
 * Writes selected hex into a hidden input named `name`.
 */
export function ColorPicker({ name, defaultValue }: Props) {
  const [selected, setSelected] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selected} />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-12 h-12 rounded border border-[#1F4D3F] hover:border-primary-fixed-dim transition-colors"
        style={{ background: selected }}
        aria-label="Choose color"
      />

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-14 z-50 w-72 surface-1 rounded-lg p-3 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-label-caps font-label-caps text-primary-fixed-dim">
                CHOOSE COLOR
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-on-surface-variant hover:text-accent-pink text-sm w-6 h-6 rounded flex items-center justify-center"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {COLOR_PALETTE.map((c) => {
                const isSelected = c.toLowerCase() === selected.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setSelected(c);
                      setOpen(false);
                    }}
                    style={{ background: c }}
                    aria-label={c}
                    className={
                      isSelected
                        ? "w-10 h-10 rounded ring-2 ring-primary-fixed-dim ring-offset-2 ring-offset-[#0a1f1a]"
                        : "w-10 h-10 rounded hover:scale-110 transition-transform"
                    }
                  />
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
