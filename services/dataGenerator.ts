import { Employee, EmployeeRole, PaymentType, MPFScheme, MaritalStatus, PayrollRecord, DisregardedPeriod } from '../types';

const FIRST_NAMES = ["Diana", "Fiona", "Gary", "Mike", "John", "Alice", "Bob", "Charlie", "Eve", "George", "Helen", "Ian", "Jenny", "Kevin", "Lily", "Mark", "Nancy", "Oscar", "Paul", "Queen"];
const SURNAMES = ["Chan", "Wong", "Lee", "Cheung", "Lau", "Ng", "Ho", "Yeung", "Leung", "Chow"];

const generateHKID = (index: number) => {
  const prefix = String.fromCharCode(65 + (index % 26));
  const digits = Math.floor(100000 + Math.random() * 900000);
  const check = Math.floor(Math.random() * 10);
  return `${prefix}${digits}(${check})`;
};

const generateDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};

const generatePhoneNumber = () => {
  // Generate 8 digit number starting with 5, 6, or 9
  const prefix = [5, 6, 9][Math.floor(Math.random() * 3)];
  const suffix = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix}${suffix}`;
};

export const generateEmployees = (): Employee[] => {
  const employees: Employee[] = [];
  
  for (let i = 0; i < 20; i++) {
    const isMonthly = i < 10;
    const role = isMonthly 
      ? (i < 3 ? EmployeeRole.Manager : EmployeeRole.Chef)
      : (i < 15 ? EmployeeRole.Waiter : EmployeeRole.Cleaner);
    
    const gender = i % 2 === 0 ? 'M' : 'F';
    // Using randomuser.me portraits which are gendered and look realistic
    // Offset index to get variety
    const photoGender = gender === 'M' ? 'men' : 'women';
    const photoIndex = (i * 3) % 99; 

    employees.push({
      id: `EMP${String(i + 1).padStart(3, '0')}`,
      hkid: generateHKID(i),
      name: `${SURNAMES[i % SURNAMES.length]} ${FIRST_NAMES[i]}`,
      gender: gender,
      maritalStatus: i % 3 === 0 ? MaritalStatus.Single : MaritalStatus.Married,
      role: role,
      paymentType: isMonthly ? PaymentType.Monthly : PaymentType.Casual,
      baseRate: isMonthly ? 18000 + (Math.random() * 10000) : 600 + (Math.random() * 200),
      joinDate: generateDate(new Date(2020, 0, 1), new Date(2023, 11, 31)),
      mpfScheme: isMonthly ? MPFScheme.MasterTrust : MPFScheme.IndustryScheme,
      voluntaryContributionRate: Math.random() > 0.8 ? 5 : 0,
      profilePicture: `https://randomuser.me/api/portraits/${photoGender}/${photoIndex}.jpg`,
      contactNumber: generatePhoneNumber()
    });
  }
  return employees;
};

export const generateInitialHistory = (employees: Employee[]): { records: PayrollRecord[], disregarded: DisregardedPeriod[] } => {
  const records: PayrollRecord[] = [];
  const disregarded: DisregardedPeriod[] = [];
  const months = [
    "2024-12", "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", 
    "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11"
  ];

  employees.forEach(emp => {
    months.forEach(month => {
      let gross = 0;
      let days = 0;
      let isDisregarded = false;
      let disregardedReason = "";
      let disregardedPay = 0;
      let disregardedDays = 0;

      // Standard Calc
      if (emp.paymentType === PaymentType.Monthly) {
        gross = emp.baseRate;
        days = 30; // Standardizing month days for MVP
      } else {
        days = Math.floor(15 + Math.random() * 10); // Casual works 15-25 days
        gross = days * emp.baseRate;
      }

      // Inject Test Cases
      // 1. Diana (Monthly): Maternity Oct/Nov 2025 (4/5ths)
      if (emp.name.includes("Diana") && (month === "2025-10" || month === "2025-11")) {
        isDisregarded = true;
        disregardedReason = "Maternity Leave";
        gross = gross * 0.8;
        disregardedPay = gross;
        disregardedDays = 30;
        
        // Add to disregarded list only once per logic block execution intended for UI consistency
        if (!disregarded.find(d => d.employeeId === emp.id && d.month === month)) {
             disregarded.push({
                id: Math.random().toString(36).substr(2, 9),
                employeeId: emp.id,
                month,
                reason: 'Maternity',
                days: 30,
                payRule: '4/5'
             });
        }
      }

      // 2. Fiona (Monthly): Sick June 2025 (Assume 7 days sick, 4/5 pay for those days)
      if (emp.name.includes("Fiona") && month === "2025-06") {
        isDisregarded = true;
        disregardedReason = "Sickness Allowance";
        const sickDays = 7;
        const dailyRate = emp.baseRate / 30;
        const normalPay = (30 - sickDays) * dailyRate;
        const sickPay = sickDays * dailyRate * 0.8;
        
        gross = normalPay + sickPay;
        disregardedPay = sickPay; // 713 says exclude the period and the pay
        disregardedDays = sickDays;

        if (!disregarded.find(d => d.employeeId === emp.id && d.month === month)) {
            disregarded.push({
               id: Math.random().toString(36).substr(2, 9),
               employeeId: emp.id,
               month,
               reason: 'Sickness',
               days: sickDays,
               payRule: '4/5'
            });
       }
      }

      // 3. Gary (Monthly): WIC Aug 2025 (4/5ths)
      if (emp.name.includes("Gary") && month === "2025-08") {
        isDisregarded = true;
        disregardedReason = "Work Injury";
        gross = gross * 0.8;
        disregardedPay = gross;
        disregardedDays = 30;

        if (!disregarded.find(d => d.employeeId === emp.id && d.month === month)) {
            disregarded.push({
               id: Math.random().toString(36).substr(2, 9),
               employeeId: emp.id,
               month,
               reason: 'WIC',
               days: 30,
               payRule: '4/5'
            });
       }
      }

      // 4. Mike (Monthly): Unpaid Leave Nov 2025
      if (emp.name.includes("Mike") && month === "2025-11") {
        isDisregarded = true;
        disregardedReason = "Unpaid Leave";
        const unpaidDays = 15;
        const dailyRate = emp.baseRate / 30;
        gross = (30 - unpaidDays) * dailyRate;
        disregardedPay = 0; // No pay to exclude, but days must be excluded
        disregardedDays = unpaidDays;

        if (!disregarded.find(d => d.employeeId === emp.id && d.month === month)) {
            disregarded.push({
               id: Math.random().toString(36).substr(2, 9),
               employeeId: emp.id,
               month,
               reason: 'Unpaid',
               days: unpaidDays,
               payRule: 'No Pay'
            });
       }
      }

      // Calculate MPF
      let mpfRelevant = gross;
      let erMandatory = 0;
      let eeMandatory = 0;

      if (emp.mpfScheme === MPFScheme.MasterTrust) {
         // Monthly
         if (mpfRelevant > 30000) {
            eeMandatory = 1500;
            erMandatory = 1500;
         } else if (mpfRelevant < 7100) {
            eeMandatory = 0;
            erMandatory = mpfRelevant * 0.05;
         } else {
            eeMandatory = mpfRelevant * 0.05;
            erMandatory = mpfRelevant * 0.05;
         }
      } else {
          // Industry Scheme (Casual) - Simplified Band Logic
          // Assuming gross is total for month, average daily for band calculation logic
          // This is an approximation for the MVP. Real engine would calc per day.
          const dailyAvg = gross / days;
          let erDaily = 0;
          let eeDaily = 0;
          
          if (dailyAvg < 280) { erDaily = 10; eeDaily = 0; }
          else if (dailyAvg < 350) { erDaily = 10; eeDaily = 10; }
          else if (dailyAvg < 650) { erDaily = 20; eeDaily = 20; }
          else { erDaily = Math.min(50, dailyAvg * 0.05); eeDaily = Math.min(50, dailyAvg * 0.05); }

          erMandatory = erDaily * days;
          eeMandatory = eeDaily * days;
      }

      records.push({
        id: `${emp.id}-${month}`,
        employeeId: emp.id,
        period: month,
        grossPay: Math.round(gross),
        totalDays: days,
        mpfRelevantIncome: Math.round(gross),
        mpfEmployerMandatory: Math.round(erMandatory),
        mpfEmployeeMandatory: Math.round(eeMandatory),
        mpfEmployeeVoluntary: Math.round(gross * (emp.voluntaryContributionRate / 100)),
        isDisregarded,
        disregardedReason,
        disregardedPay: Math.round(disregardedPay),
        disregardedDays,
        netPay: Math.round(gross - eeMandatory - (gross * (emp.voluntaryContributionRate / 100)))
      });
    });
  });

  return { records, disregarded };
};