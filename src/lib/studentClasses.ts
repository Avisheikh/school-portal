export const STUDENT_CLASSES = [
  "Play Group",
  "Nursery",
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
] as const;

export type StudentClass = (typeof STUDENT_CLASSES)[number];
