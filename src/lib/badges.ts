export type BadgeType = "WEEK_WARRIOR" | "MONTH_MASTER" | "CENTURY_CHAMPION";

export interface BadgeDefinition {
  type: BadgeType;
  label: string;
  emoji: string;
  threshold: number;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { type: "WEEK_WARRIOR",     label: "Week Warrior",     emoji: "🥉", threshold: 7   },
  { type: "MONTH_MASTER",     label: "Month Master",     emoji: "🥈", threshold: 30  },
  { type: "CENTURY_CHAMPION", label: "Century Champion", emoji: "🏆", threshold: 100 },
];
