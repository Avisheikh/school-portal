export type WeeklyAttachment = {
  url: string;
  name: string;
  kind: "image" | "document";
};

/** Weekly meeting / field report (SOSD + Pinky House). */
export type WeeklyReport = {
  id: string;
  email: string;
  weekStartDate: string; // YYYY-MM-DD (typically Monday)
  departmentLeadName: string;
  avgStudentsPresent: string;
  staffLeave: string;
  leisureClasses: string;
  schoolOpeningDays: string;
  mealsByDay: string;
  achievements: string;
  challenges: string;
  nextWeekPlan: string;
  requirementsSosd: string;
  expensesSosd: string;
  sanitationSosd: string;
  sanitationPinkyHouse: string;
  urgentRequirementsPinkyHouse: string;
  expensesPinkyHouse: string;
  requestsPinkyHouseStaff: string;
  complaintsParentsStaff: string;
  attachmentsSosd: WeeklyAttachment[];
  attachmentsPinkyHouse: WeeklyAttachment[];
  createdAt: string;
  updatedAt: string;
};

export type WeeklyReportsDatabase = {
  reports: WeeklyReport[];
};
