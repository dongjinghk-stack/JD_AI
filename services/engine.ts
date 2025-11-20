import { Employee, PayrollRecord, ADWResult, PaymentType } from '../types';

// 713 Ordinance ADW Calculator
export const calculate713ADW = (employee: Employee, history: PayrollRecord[]): ADWResult => {
  // 1. Sort history descending
  const sorted = [...history].filter(h => h.employeeId === employee.id).sort((a, b) => b.period.localeCompare(a.period));
  
  // 2. Take last 12 months
  const last12 = sorted.slice(0, 12);

  let grossTotal = 0;
  let daysTotal = 0;
  let excludedPayTotal = 0;
  let excludedDaysTotal = 0;
  const details: any[] = [];

  last12.forEach(record => {
    grossTotal += record.grossPay;
    daysTotal += record.totalDays;

    if (record.isDisregarded) {
      excludedPayTotal += record.disregardedPay;
      excludedDaysTotal += record.disregardedDays;
    }

    details.push({
      period: record.period,
      gross: record.grossPay,
      days: record.totalDays,
      excluded: record.isDisregarded,
      excludedDays: record.disregardedDays,
      excludedPay: record.disregardedPay,
      reason: record.disregardedReason
    });
  });

  const validPay = grossTotal - excludedPayTotal;
  const validDays = daysTotal - excludedDaysTotal;

  // Avoid division by zero
  const finalADW = validDays > 0 ? validPay / validDays : 0;

  return {
    grossTotal,
    daysTotal,
    excludedPay: excludedPayTotal,
    excludedDays: excludedDaysTotal,
    finalADW: parseFloat(finalADW.toFixed(2)),
    details
  };
};

// IR56B XML Generator
export const generateIR56BXML = (employees: Employee[], history: PayrollRecord[], yearEnd: string): string => {
  const creationDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<IR56B>\n`;
  xml += `  <Header>\n`;
  xml += `    <Section>6.2.1</Section>\n`;
  xml += `    <ErName>HK CATERING SME LTD</ErName>\n`;
  xml += `    <ErFileNo>12345678</ErFileNo>\n`;
  xml += `    <YearEndDate>${yearEnd.replace(/-/g, '')}</YearEndDate>\n`;
  xml += `    <DateCreated>${creationDate}</DateCreated>\n`;
  xml += `  </Header>\n`;
  xml += `  <Transactions>\n`;

  employees.forEach(emp => {
    // Calculate yearly totals
    const empHistory = history.filter(h => h.employeeId === emp.id);
    const totalGross = empHistory.reduce((sum, h) => sum + h.grossPay, 0);
    const totalPension = empHistory.reduce((sum, h) => sum + h.mpfEmployeeMandatory, 0);
    
    const [surname, ...others] = emp.name.split(' ');
    const firstname = others.join(' ');

    xml += `    <Employee>\n`;
    xml += `      <HKID>${emp.hkid}</HKID>\n`;
    xml += `      <Name>\n`;
    xml += `        <Surname>${surname}</Surname>\n`;
    xml += `        <GivenName>${firstname}</GivenName>\n`;
    xml += `      </Name>\n`;
    xml += `      <Sex>${emp.gender}</Sex>\n`;
    xml += `      <MaritalStatus>${emp.maritalStatus === 'Married' ? 2 : 1}</MaritalStatus>\n`;
    xml += `      <Position>${emp.role}</Position>\n`;
    xml += `      <StartDate>${emp.joinDate.replace(/-/g, '')}</StartDate>\n`;
    xml += `      <IncomeDetails>\n`;
    xml += `        <IncomeParticulars>\n`;
    xml += `           <Code>A</Code>\n`; // Salary
    xml += `           <Amt>${totalGross}</Amt>\n`;
    xml += `        </IncomeParticulars>\n`;
    xml += `        <TotalIncome>${totalGross}</TotalIncome>\n`;
    xml += `      </IncomeDetails>\n`;
    xml += `      <PlaceOfResidenceIndicator>0</PlaceOfResidenceIndicator>\n`;
    xml += `    </Employee>\n`;
  });

  xml += `  </Transactions>\n`;
  xml += `</IR56B>`;

  return xml;
};