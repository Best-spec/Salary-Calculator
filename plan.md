# Web Application Specification & Implementation Plan

## 1. Tech Stack Overview
- **Framework:** Next.js 14+ (App Router, TypeScript, Tailwind CSS)
- **Database ORM:** Prisma
- **Database & Auth:** Supabase (PostgreSQL)
- **State Management / Data Fetching:** React Server Components & Server Actions

---

## 2. Database Schema (Prisma)
Create a `schema.prisma` file. The schema includes a system settings table and a daily logs table to track earnings, OT, and shifts.

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

model UserSettings {
  id                 String   @id @default(uuid())
  userId             String   @unique // Links to Supabase Auth User ID
  dailyWage          Float    @default(410.0)
  foodAllowance      Float    @default(40.0)
  morningShiftExtra  Float    @default(35.0)
  nightShiftExtra    Float    @default(55.0)
  ssoRatePercent     Float    @default(5.0) // Social Security Rate (e.g., 5%)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

model DailyWageLog {
  id             String   @id @default(uuid())
  userId         String
  date           DateTime // The specific day logged
  hasFood        Boolean  @default(true)
  otHours        Float    @default(0.0) // Number of OT hours (e.g., 1.5, 2)
  shiftType      String   @default("NONE") // "NONE", "MORNING", "NIGHT"
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([userId, date])
}

3. Core Business Logic & Calculations (TypeScript)
Implement a utility file src/utils/calculations.ts to handle the arithmetic standardizing the user's logic:

Base OT 1.5 Rate: Hourly Rate = Daily Wage / 8 -> OT 1.5 Rate Per Hour = (Daily Wage / 8) * 1.5

Total OT Pay: OT Hours * OT 1.5 Rate Per Hour

Shift Allowance: If MORNING then morningShiftExtra, if NIGHT then nightShiftExtra, else 0.

Food Allowance: If hasFood is true then foodAllowance, else 0.

OT + Shift + Food Column: Total OT Pay + Shift Allowance + Food Allowance

Social Security Deduction (SSO): Daily Wage * (ssoRatePercent / 100)

Net Daily Wage After SSO: Daily Wage - Social Security Deduction

4. UI/UX Specifications (Tailwind CSS)
Dashboard Layout
Top Settings Bar: Clean inline cards/inputs to live-edit or save base rates (Daily Wage, Food Allowance, Morning Shift, Night Shift).

Main Table: A responsive grid or HTML table matching the visual reference:

Columns: วันที่ (Day Number), ค่าข้าว (Food), โอที 1.5 (OT Hours), กะเช้า (Morning Shift Check/Amt), กะดึก (Night Shift Check/Amt), ค่าแรง (Base Wage), OT+กะ+ค่าข้าว (Sum of benefits), ค่าแรงหักประกันสังคม (Base wage minus SSO).

Footer Sticky Summary Bar: Shows Sum of OT+กะ+ค่าข้าว, Sum of ค่าแรงหักประกันสังคม, and a prominent Grand Total display (Sum of benefits + Sum of Net Wages).

5. Implementation Roadmap for AI Code Generation
Step 1: Database Setup
Define the .env file with Supabase connection strings (DATABASE_URL, DIRECT_URL).

Run npx prisma db push to generate tables.

Step 2: Server Actions (src/app/actions/wageActions.ts)
Create asynchronous server actions for:

getSettings(userId) / updateSettings(userId, data)

getMonthlyLogs(userId, year, month)

saveDailyLog(userId, date, data)

Step 3: Frontend Views
src/app/page.tsx: Main dashboard view. Fetches data on server-side and passes to the client interactive table.

src/components/WageTable.tsx: A client component implementing state management for the rows. Allows quick inputs (inputs/dropdowns for OT hours and Shift types). Calculations must react immediately upon input changing.