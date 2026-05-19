"use client";

import { useState } from "react";

const EMOJI_CATS: Record<string, string[]> = {
  "⚽ Football": ["⚽", "🥅", "🏆", "🥇", "🎯", "🏅", "🎖️", "🥈"],
  "🐾 Animals": ["🦅", "🐉", "🦁", "🐯", "🦊", "🐺", "🦋", "🦈", "🐻", "🦂", "🦉", "🦏"],
  "⚡ Legendary": ["⚡", "🔥", "🌊", "🌙", "💫", "❄️", "🌪️", "☄️"],
  "💎 Symbols": ["💎", "👑", "⚔️", "🛡️", "🗡️", "🎭", "🏹", "🔱"],
  "🚀 Sci-fi": ["🚀", "🛸", "🤖", "👾", "💥", "🌌", "⭐", "🔮"],
  "😈 Power": ["😈", "💀", "🎃", "👹", "🤺", "🥊", "💪", "🦾"],
  "🌿 Nature": ["🌿", "🍀", "🌸", "🌻", "🍁", "🌴", "🦚", "🐬"],
};

const CATS = Object.keys(EMOJI_CATS);

type Props = {
  /** Name of the hidden form input that will carry the selected emoji. */
  name: string;
  /** Initial value. */
  defaultValue: string;
};

/**
 * Emoji picker for the team form. Renders a trigger button (showing the
 * current emoji) plus a popover grid; writes the selection into a hidden
 * input named `name` so the surrounding <form action={...}> picks it up.
 */
export function EmojiPicker({ name, defaultValue }: Props) {
  const [selected, setSelected] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState(CATS[0]);

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selected} />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-12 h-12 flex items-center justify-center text-3xl border border-[#1F4D3F] rounded bg-[#071411] hover:border-primary-fixed-dim transition-colors"
        aria-label="Choose emoji"
      >
        {selected}
      </button>

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
                CHOOSE EMOJI
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

            <div className="flex gap-1 mb-2 overflow-x-auto odin-scroll pb-1">
              {CATS.map((c) => {
                const active = c === cat;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCat(c)}
                    className={
                      active
                        ? "px-2 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-[rgba(173,248,54,0.15)] text-primary-fixed-dim border border-[rgba(173,248,54,0.3)]"
                        : "px-2 py-1 rounded text-[11px] font-semibold whitespace-nowrap bg-[rgba(255,255,255,0.04)] text-on-surface-variant hover:text-primary-fixed-dim"
                    }
                  >
                    {c.split(" ")[0]}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-8 gap-1 max-h-52 overflow-y-auto odin-scroll">
              {EMOJI_CATS[cat].map((e) => {
                const isSelected = e === selected;
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      setSelected(e);
                      setOpen(false);
                    }}
                    className={
                      isSelected
                        ? "w-8 h-8 rounded flex items-center justify-center text-lg bg-[rgba(173,248,54,0.2)] ring-2 ring-primary-fixed-dim"
                        : "w-8 h-8 rounded flex items-center justify-center text-lg hover:bg-[rgba(173,248,54,0.15)] hover:scale-110 transition-transform"
                    }
                  >
                    {e}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
