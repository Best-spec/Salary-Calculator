'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const MOCK_USER_ID = 'mock-user-123';

export async function getSettings() {
  let settings = await prisma.userSettings.findUnique({
    where: { userId: MOCK_USER_ID },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: { userId: MOCK_USER_ID },
    });
  }
  return settings;
}

export async function updateSettings(data: {
  dailyWage?: number;
  foodAllowance?: number;
  morningShiftExtra?: number;
  nightShiftExtra?: number;
  ssoRatePercent?: number;
}) {
  await prisma.userSettings.upsert({
    where: { userId: MOCK_USER_ID },
    update: data,
    create: {
      userId: MOCK_USER_ID,
      ...data,
    },
  });
  revalidatePath('/');
}

export async function getLogsInRange(startDate: Date, endDate: Date) {
  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  return await prisma.dailyWageLog.findMany({
    where: {
      userId: MOCK_USER_ID,
      date: {
        gte: startDate,
        lte: endOfDay,
      },
    },
    orderBy: { date: 'asc' },
  });
}

export async function saveDailyLog(
  dateStr: string,
  data: { hasFood: boolean; otHours: number; shiftType: string }
) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  await prisma.dailyWageLog.upsert({
    where: {
      userId_date: {
        userId: MOCK_USER_ID,
        date: startOfDay,
      },
    },
    update: data,
    create: {
      userId: MOCK_USER_ID,
      date: startOfDay,
      ...data,
    },
  });
  revalidatePath('/');
}

export async function deleteDailyLog(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  try {
    await prisma.dailyWageLog.delete({
      where: {
        userId_date: {
          userId: MOCK_USER_ID,
          date: startOfDay,
        },
      },
    });
  } catch (error) {
    // ignore if not found
  }
  revalidatePath('/');
}
