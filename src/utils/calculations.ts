export type ShiftType = 'MORNING' | 'NIGHT' | 'NONE';

export interface DailyMetricsParams {
  dailyWage: number;
  foodAllowance: number;
  morningShiftExtra: number;
  nightShiftExtra: number;
  ssoRatePercent: number;
  hasFood: boolean;
  otHours: number;
  shiftType: ShiftType;
  workingHoursPerDay?: number;
  otMultiplier?: number;
  isDouble?: boolean;
}

export function calculateDailyMetrics({
  dailyWage,
  foodAllowance,
  morningShiftExtra,
  nightShiftExtra,
  ssoRatePercent,
  hasFood,
  otHours,
  shiftType,
  workingHoursPerDay = 8,
  otMultiplier = 1.5,
  isDouble = false,
}: DailyMetricsParams) {
  const effectiveDailyWage = isDouble ? dailyWage * 2 : dailyWage;
  const hourlyRate = dailyWage / workingHoursPerDay;
  const otRatePerHour = 75; // Adjusted to 75 Baht per hour
  const totalOtPay = otHours * otRatePerHour;

  let shiftAllowance = 0;
  if (shiftType === 'MORNING') shiftAllowance = morningShiftExtra;
  else if (shiftType === 'NIGHT') shiftAllowance = nightShiftExtra;

  const actualFoodAllowance = hasFood ? foodAllowance : 0;

  const totalExtras = totalOtPay + shiftAllowance + actualFoodAllowance;

  // Assuming SSO is deducted per day based on the base daily wage.
  // In reality, it's often monthly, but based on plan: "Daily Wage * (ssoRatePercent / 100)"
  const ssoDeduction = dailyWage * (ssoRatePercent / 100);
  const netBaseWage = effectiveDailyWage - ssoDeduction;

  const grandTotal = totalExtras + netBaseWage;

  return {
    totalOtPay,
    shiftAllowance,
    actualFoodAllowance,
    totalExtras,
    ssoDeduction,
    netBaseWage,
    grandTotal,
  };
}
