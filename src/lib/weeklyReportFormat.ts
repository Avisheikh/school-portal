import type { WeeklyReport } from "./weeklyReportTypes";

export function weekEndFromStart(weekStart: string): string {
  const d = new Date(weekStart + "T12:00:00");
  d.setDate(d.getDate() + 6);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday of the week containing `date` (local). */
export function mondayOfWeek(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dayNum = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayNum}`;
}

export function formatWeeklyReportText(r: WeeklyReport): string {
  const end = weekEndFromStart(r.weekStartDate);
  const lines = [
    `SOSD Weekly Report`,
    `Week: ${r.weekStartDate} to ${end}`,
    `Department Lead: ${r.departmentLeadName}`,
    `Email: ${r.email}`,
    ``,
    `1. Average students present: ${r.avgStudentsPresent}`,
    `2. Staff leave this week: ${r.staffLeave}`,
    `3. Leisure classes: ${r.leisureClasses}`,
    `4. School opening days: ${r.schoolOpeningDays}`,
    `5. Meals by day: ${r.mealsByDay}`,
    `6. Achievements (SOSD): ${r.achievements}`,
    `7. Challenges: ${r.challenges}`,
    `8. Next week plan: ${r.nextWeekPlan}`,
    `9. Requirements (SOSD): ${r.requirementsSosd}`,
    `10. Expenses (SOSD): ${r.expensesSosd}`,
    `11. Sanitation (SOSD): ${r.sanitationSosd}`,
    `12. Sanitation (Pinky House): ${r.sanitationPinkyHouse}`,
    `13. Urgent requirements (Pinky House): ${r.urgentRequirementsPinkyHouse}`,
    `14. Expenses (Pinky House): ${r.expensesPinkyHouse}`,
    `15. Pinky House staff requests/complaints: ${r.requestsPinkyHouseStaff}`,
    `16. Parents/staff complaints or suggestions: ${r.complaintsParentsStaff}`,
  ];
  if (r.attachmentsSosd?.length) {
    lines.push(
      `SOSD attachments: ${r.attachmentsSosd.map((a) => a.name).join(", ")}`,
    );
  }
  if (r.attachmentsPinkyHouse?.length) {
    lines.push(
      `Pinky House attachments: ${r.attachmentsPinkyHouse.map((a) => a.name).join(", ")}`,
    );
  }
  return lines.join("\n");
}
