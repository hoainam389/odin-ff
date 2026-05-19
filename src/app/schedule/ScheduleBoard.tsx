"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MatchWithResult } from "@/lib/queries";
import type { Team } from "@/db/schema";
import { moveMatchAction } from "../admin/actions";

type Props = {
  matches: MatchWithResult[];
  teams: Team[];
  today: string;
  formatBanner: Record<string, string>;
};

export function ScheduleBoard({ matches, teams, today, formatBanner }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Local working copy so drops move the row instantly; we re-sync to props
  // once the server returns fresh data via router.refresh().
  const [localMatches, setLocalMatches] = useState(matches);
  useEffect(() => {
    setLocalMatches(matches);
  }, [matches]);

  const [dragId, setDragId] = useState<number | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [hoverRow, setHoverRow] = useState<number | null>(null);

  const teamMap = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams]);

  const grouped = useMemo(() => {
    const sorted = [...localMatches].sort((a, b) => a.displayOrder - b.displayOrder);
    const map = new Map<string, MatchWithResult[]>();
    sorted.forEach((m) => {
      const arr = map.get(m.matchDate) ?? [];
      arr.push(m);
      map.set(m.matchDate, arr);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [localMatches]);

  /**
   * Apply the same reorder logic locally that the server action does,
   * so the visible list updates the moment the drop lands.
   */
  function applyLocalMove(matchId: number, targetDate: string, targetOrder?: number) {
    setLocalMatches((prev) => {
      const sorted = [...prev].sort((a, b) => a.displayOrder - b.displayOrder);
      const moving = sorted.find((m) => m.id === matchId);
      if (!moving) return prev;
      const others = sorted.filter((m) => m.id !== matchId);

      let insertIdx: number;
      if (typeof targetOrder === "number") {
        insertIdx = Math.min(Math.max(targetOrder, 0), others.length);
      } else {
        // append to end of target day
        let lastIdxOnDay = -1;
        others.forEach((m, i) => {
          if (m.matchDate === targetDate) lastIdxOnDay = i;
        });
        if (lastIdxOnDay >= 0) {
          insertIdx = lastIdxOnDay + 1;
        } else {
          const firstAfter = others.findIndex((m) => m.matchDate > targetDate);
          insertIdx = firstAfter === -1 ? others.length : firstAfter;
        }
      }

      const reordered = [...others];
      reordered.splice(insertIdx, 0, { ...moving, matchDate: targetDate });
      return reordered.map((m, i) => ({ ...m, displayOrder: i }));
    });
  }

  function submitMove(matchId: number, targetDate: string, targetOrder?: number) {
    applyLocalMove(matchId, targetDate, targetOrder);
    const fd = new FormData();
    fd.set("matchId", String(matchId));
    fd.set("targetDate", targetDate);
    if (typeof targetOrder === "number") fd.set("targetOrder", String(targetOrder));
    startTransition(async () => {
      try {
        await moveMatchAction(fd);
      } finally {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {grouped.map(([date, items]) => {
        const isToday = date === today;
        const isPast = date < today;
        const completedCount = items.filter((m) => m.result).length;
        const zoneHover = hoverDate === date;
        return (
          <div key={date} className="flex flex-col gap-unit">
            <div
              className={`w-full bg-black scanline-header border p-3 flex justify-between items-center rounded-sm transition-colors ${
                zoneHover ? "border-primary-fixed-dim" : "border-[#1F4D3F]"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setHoverDate(date);
              }}
              onDragLeave={() => setHoverDate(null)}
              onDrop={(e) => {
                e.preventDefault();
                setHoverDate(null);
                if (dragId !== null) submitMove(dragId, date);
                setDragId(null);
              }}
            >
              <span
                className={`text-headline-md font-headline-md uppercase ${
                  isToday ? "text-primary-fixed-dim" : "text-on-surface"
                }`}
              >
                {formatBanner[date] ?? date}
              </span>
              <div className="flex items-center gap-3">
                {isToday && (
                  <span className="bg-primary-fixed-dim text-[#050807] px-2 py-0.5 text-label-caps font-label-caps rounded-sm">
                    TODAY
                  </span>
                )}
                {isPast && !isToday && (
                  <span className="bg-surface-variant text-on-surface-variant px-2 py-0.5 text-label-caps font-label-caps rounded-sm">
                    PAST
                  </span>
                )}
                <span className="text-label-caps font-label-caps text-on-surface-variant">
                  {completedCount} / {items.length} PLAYED
                </span>
              </div>
            </div>

            <div
              className={`flex flex-col gap-2 p-2 rounded transition-colors ${
                zoneHover ? "bg-[rgba(173,248,54,0.06)]" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setHoverDate(date);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setHoverDate(null);
                if (dragId !== null) submitMove(dragId, date);
                setDragId(null);
              }}
            >
              {items.map((m) => {
                const home = teamMap[m.homeTeam];
                const away = teamMap[m.awayTeam];
                const isDragging = dragId === m.id;
                const isHover = hoverRow === m.id;
                return (
                  <div
                    key={m.id}
                    draggable
                    onDragStart={() => setDragId(m.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setHoverRow(null);
                      setHoverDate(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setHoverRow(m.id);
                    }}
                    onDragLeave={() => setHoverRow((id) => (id === m.id ? null : id))}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setHoverRow(null);
                      setHoverDate(null);
                      if (dragId !== null && dragId !== m.id) {
                        submitMove(dragId, m.matchDate, m.displayOrder);
                      }
                      setDragId(null);
                    }}
                    className={`surface-1 p-3 flex items-center justify-between rounded cursor-grab active:cursor-grabbing transition-colors ${
                      isDragging ? "opacity-40" : ""
                    } ${isHover ? "border-primary-fixed-dim" : ""}`}
                  >
                    <span className="text-on-surface-variant text-xl select-none">⋮⋮</span>
                    <div className="flex-1 flex justify-end items-center gap-3 pr-4">
                      <span className="font-body-md uppercase">
                        {home?.name.replace("Team ", "")}
                      </span>
                      <span className="text-2xl">{home?.emoji}</span>
                    </div>
                    <div className="flex flex-col items-center w-28">
                      {m.result ? (
                        <span className="text-scoreboard-num text-xl text-primary-fixed-dim">
                          {m.result.scoreHome} - {m.result.scoreAway}
                        </span>
                      ) : (
                        <span className="text-label-caps font-label-caps text-on-surface-variant">
                          TBD
                        </span>
                      )}
                    </div>
                    <div className="flex-1 flex justify-start items-center gap-3 pl-4">
                      <span className="text-2xl">{away?.emoji}</span>
                      <span className="font-body-md uppercase">
                        {away?.name.replace("Team ", "")}
                      </span>
                    </div>
                    <Link
                      href={`/admin/matches/${m.id}`}
                      className="px-3 py-1 surface-1 text-primary-fixed-dim text-label-caps font-label-caps rounded hover:bg-[#0c2620] transition-colors ml-3"
                    >
                      EDIT
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
