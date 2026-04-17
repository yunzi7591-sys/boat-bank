import { prisma } from "@/lib/prisma";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function getJstDateKey(date: Date): string {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  return jst.toISOString().slice(0, 10);
}

function jstDayDiff(from: Date, to: Date): number {
  const fromJst = new Date(from.getTime() + JST_OFFSET_MS);
  const toJst = new Date(to.getTime() + JST_OFFSET_MS);
  const fromMidnight = Date.UTC(fromJst.getUTCFullYear(), fromJst.getUTCMonth(), fromJst.getUTCDate());
  const toMidnight = Date.UTC(toJst.getUTCFullYear(), toJst.getUTCMonth(), toJst.getUTCDate());
  return Math.round((toMidnight - fromMidnight) / (1000 * 60 * 60 * 24));
}

export function dailyPointsForStreak(streak: number): number {
  if (streak >= 7) return 700;
  if (streak >= 3) return 500;
  return 300;
}

export type LoginBonusResult = {
  streak: number;
  dailyPoints: number;
  isStreakUp: boolean;
};

export async function checkAndUpdateLoginStreak(userId: string): Promise<LoginBonusResult | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loginStreak: true, lastLoginDate: true, dailyPoints: true },
  });
  if (!user) return null;

  const now = new Date();
  const todayKey = getJstDateKey(now);
  const lastKey = user.lastLoginDate ? getJstDateKey(user.lastLoginDate) : null;

  if (lastKey === todayKey) return null;

  let newStreak: number;
  if (!user.lastLoginDate) {
    newStreak = 1;
  } else {
    const diff = jstDayDiff(user.lastLoginDate, now);
    newStreak = diff === 1 ? user.loginStreak + 1 : 1;
  }

  const newDailyPoints = dailyPointsForStreak(newStreak);
  const previousDailyPoints = dailyPointsForStreak(user.loginStreak);

  await prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginDate: now,
      loginStreak: newStreak,
      dailyPoints: newDailyPoints,
    },
  });

  return {
    streak: newStreak,
    dailyPoints: newDailyPoints,
    isStreakUp: newDailyPoints > previousDailyPoints,
  };
}
