import type { ChatSummary } from "../types";

export type ChatGroup = { label: string; chats: ChatSummary[] };

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function groupChatsByDate(chats: ChatSummary[]): ChatGroup[] {
  const now = new Date();
  const today = startOfDay(now).getTime();
  const yesterday = today - 86400000;
  const weekAgo = today - 7 * 86400000;

  const buckets: Record<string, ChatSummary[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 days": [],
    Older: [],
  };

  for (const c of chats) {
    const raw = c.updated_at;
    if (!raw) {
      buckets.Older.push(c);
      continue;
    }
    const t = new Date(raw.includes("T") ? raw : raw.replace(" ", "T")).getTime();
    if (Number.isNaN(t)) {
      buckets.Older.push(c);
      continue;
    }
    const day = startOfDay(new Date(t)).getTime();
    if (day >= today) buckets.Today.push(c);
    else if (day >= yesterday) buckets.Yesterday.push(c);
    else if (day >= weekAgo) buckets["Previous 7 days"].push(c);
    else buckets.Older.push(c);
  }

  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, chats: items }));
}
