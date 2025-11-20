export enum EmployeeRole {
  Manager = "Manager",
  Chef = "Chef",
  Waiter = "Waiter",
  Cleaner = "Cleaner",
  Admin = "Admin"
}

export enum PaymentType {
  Monthly = "Monthly",
  Casual = "Casual"
}

export enum MPFScheme {
  MasterTrust = "Master Trust",
  IndustryScheme = "Industry Scheme"
}

export enum MaritalStatus {
  Single = "Single",
  Married = "Married",
  Divorced = "Divorced"
}

export interface Employee {
  id: string;
  hkid: string;
  name: string; // Format: Surname Firstname
  gender: 'M' | 'F';
  maritalStatus: MaritalStatus;
  role: EmployeeRole;
  paymentType: PaymentType;
  baseRate: number; // Monthly salary or Daily rate
  joinDate: string;
  mpfScheme: MPFScheme;
  voluntaryContributionRate: number; // percentage (0-100)
  profilePicture: string;
  contactNumber: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  period: string; // YYYY-MM
  grossPay: number;
  totalDays: number; // Work days in month
  
  // MPF
  mpfRelevantIncome: number;
  mpfEmployerMandatory: number;
  mpfEmployeeMandatory: number;
  mpfEmployeeVoluntary: number;
  
  // 713 Compliance Flags
  isDisregarded: boolean;
  disregardedReason?: string;
  disregardedPay: number; // Amount to exclude from ADW
  disregardedDays: number; // Days to exclude from ADW
  
  netPay: number;
}

export interface DisregardedPeriod {
  id: string;
  employeeId: string;
  month: string; // YYYY-MM
  reason: 'Maternity' | 'Sickness' | 'WIC' | 'Unpaid' | 'Other';
  days: number;
  payRule: '4/5' | 'No Pay' | 'Full Pay';
}

export interface ADWResult {
  grossTotal: number;
  daysTotal: number;
  excludedPay: number;
  excludedDays: number;
  finalADW: number;
  details: {
    period: string;
    gross: number;
    days: number;
    excluded: boolean;
    reason?: string;
  }[];
}