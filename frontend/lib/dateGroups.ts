import type { ConversationSummary } from './conversationApi';

const GROUP_ORDER = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'] as const;
export type DateGroup = (typeof GROUP_ORDER)[number];

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function groupFor(updatedAt: string): DateGroup {
  const today = startOfDay(new Date());
  const day = startOfDay(new Date(updatedAt));
  const diffDays = Math.round((today - day) / 86400000);

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Previous 7 Days';
  return 'Older';
}

export function groupConversationsByDate(
  conversations: ConversationSummary[]
): { group: DateGroup; items: ConversationSummary[] }[] {
  const buckets = new Map<DateGroup, ConversationSummary[]>();
  for (const group of GROUP_ORDER) buckets.set(group, []);

  for (const c of conversations) {
    buckets.get(groupFor(c.updatedAt))!.push(c);
  }

  return GROUP_ORDER
    .map(group => ({ group, items: buckets.get(group)! }))
    .filter(b => b.items.length > 0);
}
