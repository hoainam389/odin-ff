"use server";

import { revalidatePath } from "next/cache";
import { eq, asc, sql } from "drizzle-orm";
import { db, withDb } from "@/db/client";
import { teams, members, matches, results } from "@/db/schema";
import { autoScheduleDates, todayISO } from "@/lib/league";
import { getSession } from "@/lib/session";
import { invalidate, CACHE_KEYS } from "@/lib/cache";

async function requireAdmin() {
  const session = await getSession();
  if (!session.admin) throw new Error("Unauthorized");
}

function revalidatePublic() {
  // Fire-and-forget Redis invalidation — response shouldn't wait on it.
  invalidate(
    CACHE_KEYS.league,
    CACHE_KEYS.teams,
    CACHE_KEYS.matches,
    CACHE_KEYS.members,
  ).catch(() => {});
  revalidatePath("/");
  revalidatePath("/fixtures");
  revalidatePath("/matches", "layout");
}

/* ── Teams ────────────────────────────────────────────────────────────── */

export async function updateTeamAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const emoji = String(formData.get("emoji") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  if (!id || !name || !emoji || !color) return;
  await withDb(() => db.update(teams).set({ name, emoji, color }).where(eq(teams.id, id)));
  revalidatePath("/admin/teams");
  revalidatePublic();
}

export async function addMemberAction(formData: FormData) {
  await requireAdmin();
  const teamId = String(formData.get("teamId"));
  const name = String(formData.get("name") ?? "").trim();
  if (!teamId || !name) return;
  await withDb(() => db.insert(members).values({ teamId, name }));
  await invalidate(CACHE_KEYS.members);
  revalidatePath("/admin/teams");
}

export async function removeMemberAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await withDb(() => db.delete(members).where(eq(members.id, id)));
  await invalidate(CACHE_KEYS.members);
  revalidatePath("/admin/teams");
}

/* ── Result entry ─────────────────────────────────────────────────────── */

export async function upsertResultAction(formData: FormData) {
  await requireAdmin();
  const matchId = Number(formData.get("matchId"));
  if (!Number.isFinite(matchId)) return;
  const data = {
    matchId,
    scoreHome: Math.max(0, Number(formData.get("scoreHome") ?? 0)),
    scoreAway: Math.max(0, Number(formData.get("scoreAway") ?? 0)),
    yellowHome: Math.max(0, Number(formData.get("yellowHome") ?? 0)),
    yellowAway: Math.max(0, Number(formData.get("yellowAway") ?? 0)),
    redHome: Math.max(0, Number(formData.get("redHome") ?? 0)),
    redAway: Math.max(0, Number(formData.get("redAway") ?? 0)),
    updatedAt: new Date(),
  };
  await withDb(() =>
    db
      .insert(results)
      .values(data)
      .onConflictDoUpdate({
        target: results.matchId,
        set: {
          scoreHome: data.scoreHome,
          scoreAway: data.scoreAway,
          yellowHome: data.yellowHome,
          yellowAway: data.yellowAway,
          redHome: data.redHome,
          redAway: data.redAway,
          updatedAt: new Date(),
        },
      }),
  );
  revalidatePath(`/admin/matches/${matchId}`);
  revalidatePath(`/matches/${matchId}`);
  revalidatePublic();
}

export async function deleteResultAction(formData: FormData) {
  await requireAdmin();
  const matchId = Number(formData.get("matchId"));
  if (!Number.isFinite(matchId)) return;
  await withDb(() => db.delete(results).where(eq(results.matchId, matchId)));
  revalidatePath(`/admin/matches/${matchId}`);
  revalidatePath(`/matches/${matchId}`);
  revalidatePublic();
}

/* ── Schedule ─────────────────────────────────────────────────────────── */

export async function moveMatchAction(formData: FormData) {
  await requireAdmin();
  const matchId = Number(formData.get("matchId"));
  const targetDate = String(formData.get("targetDate") ?? "");
  const targetOrderRaw = formData.get("targetOrder");
  if (!Number.isFinite(matchId) || !targetDate) return;

  const all = await withDb(() =>
    db.select().from(matches).orderBy(asc(matches.displayOrder)),
  );
  const others = all.filter((m) => m.id !== matchId);
  const moving = all.find((m) => m.id === matchId);
  if (!moving) return;

  const sameDayIndices: number[] = [];
  others.forEach((m, idx) => {
    if (m.matchDate === targetDate) sameDayIndices.push(idx);
  });

  let insertIdx: number;
  if (targetOrderRaw !== null && targetOrderRaw !== undefined && targetOrderRaw !== "") {
    const t = Number(targetOrderRaw);
    if (Number.isFinite(t)) {
      insertIdx = Math.min(Math.max(t, 0), others.length);
    } else {
      insertIdx = sameDayIndices.length > 0 ? sameDayIndices[sameDayIndices.length - 1] + 1 : others.length;
    }
  } else if (sameDayIndices.length > 0) {
    insertIdx = sameDayIndices[sameDayIndices.length - 1] + 1;
  } else {
    const firstAfter = others.findIndex((m) => m.matchDate > targetDate);
    insertIdx = firstAfter === -1 ? others.length : firstAfter;
  }

  const newOrder = [...others];
  newOrder.splice(insertIdx, 0, { ...moving, matchDate: targetDate });

  // Only persist rows whose (matchDate, displayOrder) actually changed.
  // For 21 matches a drag usually touches 1-4, so we save ~17 round-trips.
  const oldByOrder = new Map(all.map((m, i) => [m.id, { date: m.matchDate, order: i }]));
  const changed: { id: number; matchDate: string; displayOrder: number }[] = [];
  newOrder.forEach((m, i) => {
    const newDate = m.id === matchId ? targetDate : m.matchDate;
    const prev = oldByOrder.get(m.id);
    if (!prev || prev.date !== newDate || prev.order !== i) {
      changed.push({ id: m.id, matchDate: newDate, displayOrder: i });
    }
  });

  if (changed.length > 0) {
    // One round trip: a single UPDATE … FROM (VALUES …) statement.
    const values = sql.join(
      changed.map(
        (c) => sql`(${c.id}::int, ${c.matchDate}::date, ${c.displayOrder}::int)`,
      ),
      sql`, `,
    );
    await withDb(() =>
      db.execute(sql`
        UPDATE matches AS m
        SET match_date = v.match_date, display_order = v.display_order
        FROM (VALUES ${values}) AS v(id, match_date, display_order)
        WHERE m.id = v.id
      `),
    );
  }

  revalidatePath("/admin/schedule");
  revalidatePublic();
}

export async function autoScheduleAction() {
  await requireAdmin();
  const all = await withDb(() =>
    db
      .select({
        id: matches.id,
        matchDate: matches.matchDate,
        displayOrder: matches.displayOrder,
        hasResult: sql<boolean>`(select count(*) > 0 from ${results} where ${results.matchId} = ${matches.id})`,
      })
      .from(matches)
      .orderBy(asc(matches.displayOrder)),
  );

  const updates = autoScheduleDates(
    all.map((m) => ({
      id: m.id,
      matchDate: m.matchDate,
      hasResult: Boolean(m.hasResult),
      displayOrder: m.displayOrder,
    })),
    todayISO(),
  );

  const oldById = new Map(all.map((m) => [m.id, m]));
  const changed = updates.filter((u) => {
    const prev = oldById.get(u.id);
    return !prev || prev.matchDate !== u.matchDate || prev.displayOrder !== u.displayOrder;
  });

  if (changed.length > 0) {
    const values = sql.join(
      changed.map(
        (c) => sql`(${c.id}::int, ${c.matchDate}::date, ${c.displayOrder}::int)`,
      ),
      sql`, `,
    );
    await withDb(() =>
      db.execute(sql`
        UPDATE matches AS m
        SET match_date = v.match_date, display_order = v.display_order
        FROM (VALUES ${values}) AS v(id, match_date, display_order)
        WHERE m.id = v.id
      `),
    );
  }

  revalidatePath("/admin/schedule");
  revalidatePublic();
}
