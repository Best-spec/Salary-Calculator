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
}: DailyMetricsParams) {
  const hourlyRate = dailyWage / workingHoursPerDay;
  const otRatePerHour = hourlyRate * otMultiplier;
  const totalOtPay = otHours * otRatePerHour;

  let shiftAllowance = 0;
  if (shiftType === 'MORNING') shiftAllowance = morningShiftExtra;
  else if (shiftType === 'NIGHT') shiftAllowance = nightShiftExtra;

  const actualFoodAllowance = hasFood ? foodAllowance : 0;

  const totalExtras = totalOtPay + shiftAllowance + actualFoodAllowance;

  // Assuming SSO is deducted per day based on the base daily wage.
  // In reality, it's often monthly, but based on plan: "Daily Wage * (ssoRatePercent / 100)"
  const ssoDeduction = dailyWage * (ssoRatePercent / 100);
  const netBaseWage = dailyWage - ssoDeduction;

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
