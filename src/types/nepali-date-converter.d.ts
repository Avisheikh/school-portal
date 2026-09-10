declare module "nepali-date-converter" {
  export default class NepaliDate {
    constructor(date?: Date | string);
    static fromAD(date: Date): NepaliDate;
    getYear(): number;
    getMonth(): number;
    getDate(): number;
    format(pattern?: string, language?: "en" | "np"): string;
  }
}
