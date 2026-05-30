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
  try {
    const result = await prisma.userSettings.upsert({
      where: { userId: MOCK_USER_ID },
      update: data,
      create: {
        userId: MOCK_USER_ID,
        ...data,
      },
    });
    revalidatePath('/');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Update settings error:', error);
    return { success: false, error: `บันทึกการตั้งค่าลงฐานข้อมูลไม่สำเร็จ: ${error?.message || String(error)}` };
  }
}

export async function getLogsInRange(startStr: string, endStr: string) {
  const [sy, sm, sd] = startStr.split('-').map(Number);
  const startDate = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0, 0));
  
  const [ey, em, ed] = endStr.split('-').map(Number);
  const endOfDay = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999));

  const logs = await prisma.dailyWageLog.findMany({
    where: {
      userId: MOCK_USER_ID,
      date: {
        gte: startDate,
        lte: endOfDay,
      },
    },
    orderBy: { date: 'asc' },
  });

  return logs.map(l => ({
    id: l.id,
    userId: l.userId,
    date: l.date,
    hasFood: l.hasFood,
    otHours: l.otHours,
    shiftType: l.shiftType,
    isDoubleWage: (l as any).isDoubleWage ?? false,
    dateStr: l.date.toISOString().split('T')[0]
  }));
}

export async function saveDailyLog(
  dateStr: string,
  data: { hasFood: boolean; otHours: number; shiftType: string; isDoubleWage?: boolean }
) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  try {
    const result = await prisma.dailyWageLog.upsert({
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
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Save log error:', error);
    return { success: false, error: `บันทึกข้อมูลลงฐานข้อมูลไม่สำเร็จ: ${error?.message || String(error)}` };
  }
}

export async function deleteDailyLog(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  try {
    await prisma.dailyWageLog.deleteMany({
      where: {
        userId: MOCK_USER_ID,
        date: startOfDay,
      },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Delete log error:', error);
    return { success: false, error: `ลบข้อมูลในฐานข้อมูลไม่สำเร็จ: ${error?.message || String(error)}` };
  }
}

export async function deleteDailyLogById(id: string) {
  try {
    await prisma.dailyWageLog.delete({
      where: { id },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Delete log by id error:', error);
    return { success: false, error: `ลบข้อมูลในฐานข้อมูลไม่สำเร็จ: ${error?.message || String(error)}` };
  }
}
