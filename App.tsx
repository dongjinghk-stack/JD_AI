import React, { useState, useEffect, useMemo } from 'react';
import { Employee, PayrollRecord, DisregardedPeriod, EmployeeRole, PaymentType, MPFScheme } from './types';
import { generateEmployees, generateInitialHistory } from './services/dataGenerator';
import { calculate713ADW, generateIR56BXML } from './services/engine';
import { TabButton } from './components/TabButton';
import { 
  Users, 
  Calculator, 
  AlertTriangle, 
  PiggyBank, 
  FileText, 
  Code, 
  RefreshCw, 
  Download,
  PlusCircle,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// --- Subcomponents defined here for simplicity of the XML structure, 
// in a real app these would be separate files ---

const ProfileTab: React.FC<{ employees: Employee[] }> = ({ employees }) => (
  <div className="overflow-x-auto bg-white shadow rounded-lg border border-slate-200">
    <table className="min-w-full divide-y divide-slate-200">
      <thead className="bg-slate-50">
        <tr>
          {['Employee', 'HKID', 'Role', 'Type', 'Contact', 'Base Rate', 'MPF Scheme', 'MPF % (ER/EE)', 'Join Date'].map(h => (
            <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-slate-200">
        {employees.map((emp) => (
          <tr key={emp.id} className="hover:bg-slate-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 flex items-center gap-3">
              <img src={emp.profilePicture} alt={emp.name} className="w-8 h-8 rounded-full bg-slate-200" />
              <div>
                <div className="font-bold">{emp.name}</div>
                <div className="text-xs text-slate-400 font-normal">{emp.id}</div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{emp.hkid}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${emp.role === EmployeeRole.Manager ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                {emp.role}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{emp.paymentType}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{emp.contactNumber}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${emp.baseRate.toLocaleString()}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-xs">{emp.mpfScheme}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
              {emp.mpfScheme === MPFScheme.MasterTrust ? (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs"><span className="font-semibold text-slate-700">ER:</span> 5%</span>
                  <span className="text-xs"><span className="font-semibold text-slate-700">EE:</span> 5%{emp.voluntaryContributionRate > 0 && <span className="text-emerald-600"> + {emp.voluntaryContributionRate}% Vol</span>}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Industry Scale</span>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{emp.joinDate}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CalendarTab: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 1)); // Start at Jan 2025

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  // Payroll Events Generator
  const getEvents = (d: number) => {
    const events = [];
    
    // MPF Deadline (10th of current month for previous month)
    if (d === 10) {
      events.push({ title: "MPF Submission Due", color: "bg-orange-100 text-orange-800 border-orange-200" });
    }

    // Pay Run (Last day of month)
    if (d === daysInMonth) {
      events.push({ title: "Pay Run Completion", color: "bg-emerald-100 text-emerald-800 border-emerald-200" });
    }

    // IR56B (April 15th usually, using April 1st as start of tax filing awareness)
    if (month === 3 && d === 1) { // April 1st
      events.push({ title: "Tax Year Start", color: "bg-blue-50 text-blue-600 border-blue-100" });
    }
    if (month === 3 && d === 15) { // April 15th
      events.push({ title: "IR56B Filing Deadline", color: "bg-blue-100 text-blue-800 border-blue-200" });
    }

    return events;
  };

  const days = [];
  // Padding for previous month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50 border-b border-r border-slate-100"></div>);
  }
  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const events = getEvents(d);
    days.push(
      <div key={d} className="h-32 bg-white border-b border-r border-slate-200 p-2 relative hover:bg-slate-50 transition-colors">
        <span className={`text-sm font-medium ${events.length > 0 ? 'text-slate-900' : 'text-slate-400'}`}>{d}</span>
        <div className="mt-1 space-y-1">
          {events.map((e, idx) => (
            <div key={idx} className={`text-xs px-2 py-1 rounded border ${e.color} truncate font-medium`}>
              {e.title}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-slate-200">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Calendar size={20} className="text-emerald-600"/> 
          Payroll Calendar
        </h2>
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft size={20}/></button>
          <span className="text-lg font-medium w-32 text-center">{monthNames[month]} {year}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight size={20}/></button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-l border-slate-200">
        {days}
      </div>
    </div>
  );
};

const ADWTab: React.FC<{ employees: Employee[], history: PayrollRecord[] }> = ({ employees, history }) => {
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0].id);
  
  const result = useMemo(() => {
    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return null;
    return calculate713ADW(emp, history);
  }, [selectedEmpId, employees, history]);

  const emp = employees.find(e => e.id === selectedEmpId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <label className="text-sm font-medium text-slate-700">Select Employee:</label>
        <select 
          className="block w-64 pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md border"
          value={selectedEmpId}
          onChange={(e) => setSelectedEmpId(e.target.value)}
        >
          {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
        </select>
      </div>

      {result && emp && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg overflow-hidden border border-slate-200">
              <div className="px-4 py-5 sm:px-6 bg-slate-50 border-b border-slate-200">
                <h3 className="text-lg leading-6 font-medium text-slate-900">713 Average Daily Wage Ledger</h3>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">Calculation period: Last 12 months from latest record.</p>
              </div>
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Period</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Gross Pay</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Work Days</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Excl. Pay</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Excl. Days</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {result.details.map((d: any) => (
                    <tr key={d.period} className={d.excluded ? "bg-red-50" : ""}>
                      <td className="px-4 py-3 text-sm text-slate-900">{d.period}</td>
                      <td className="px-4 py-3 text-sm text-right text-slate-600">${d.gross.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right text-slate-600">{d.days}</td>
                      <td className="px-4 py-3 text-sm text-center">
                         {d.excluded ? (
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                             Disregarded
                           </span>
                         ) : <span className="text-emerald-600 text-xs font-medium">Included</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        {d.excluded ? `-$${d.excludedPay.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        {d.excluded ? `-${d.excludedDays}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 shadow rounded-lg border border-slate-200 h-fit">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Calculation Summary</h3>
            <dl className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <dt className="text-sm text-slate-500">Total Wages (12M)</dt>
                <dd className="text-sm font-medium text-slate-900">${result.grossTotal.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-sm text-slate-500">Less: Excluded Wages</dt>
                <dd className="text-sm font-medium text-red-600">-${result.excludedPay.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-sm text-slate-500">Net Wages (A)</dt>
                <dd className="text-sm font-bold text-slate-900">${(result.grossTotal - result.excludedPay).toLocaleString()}</dd>
              </div>
              
              <div className="pt-4 flex justify-between border-b pb-2">
                <dt className="text-sm text-slate-500">Total Days (12M)</dt>
                <dd className="text-sm font-medium text-slate-900">{result.daysTotal}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-sm text-slate-500">Less: Excluded Days</dt>
                <dd className="text-sm font-medium text-red-600">-{result.excludedDays}</dd>
              </div>
               <div className="flex justify-between border-b pb-2">
                <dt className="text-sm text-slate-500">Net Days (B)</dt>
                <dd className="text-sm font-bold text-slate-900">{result.daysTotal - result.excludedDays}</dd>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <dt className="text-base font-bold text-slate-900">Average Daily Wage</dt>
                <dd className="text-2xl font-bold text-emerald-600">${result.finalADW.toLocaleString()}</dd>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">Formula: (A) / (B)</p>
            </dl>

            {result.details.filter((d: any) => d.excluded).length > 0 && (
              <div className="mt-6 bg-yellow-50 p-4 rounded border border-yellow-200">
                <h4 className="text-xs font-bold text-yellow-800 uppercase mb-2">Identified Disregarded Periods</h4>
                <ul className="list-disc pl-4 space-y-1">
                  {result.details.filter((d: any) => d.excluded).map((d: any, i: number) => (
                    <li key={i} className="text-xs text-yellow-800">
                      {d.period}: {d.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DisregardedTab: React.FC<{ 
  disregarded: DisregardedPeriod[], 
  employees: Employee[],
  onAdd: (d: Omit<DisregardedPeriod, 'id'>) => void 
}> = ({ disregarded, employees, onAdd }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<DisregardedPeriod>>({
    employeeId: employees[0].id,
    month: '2025-11',
    reason: 'Sickness',
    days: 1,
    payRule: '4/5'
  });

  const handleSubmit = () => {
    if(form.employeeId && form.month && form.reason && form.days && form.payRule) {
      onAdd(form as Omit<DisregardedPeriod, 'id'>);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Disregarded Periods Audit Log</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm"
        >
          <PlusCircle size={16} /> Add Period
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
             <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pay Rule</th>
             </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {disregarded.map(d => {
               const emp = employees.find(e => e.id === d.employeeId);
               return (
                 <tr key={d.id} className="hover:bg-slate-50">
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                     {emp?.name} <span className="text-slate-400 text-xs">({emp?.hkid})</span>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{d.month}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                       {d.reason}
                     </span>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{d.days}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{d.payRule}</td>
                 </tr>
               );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Add Disregarded Period</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Employee</label>
                <select 
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                  value={form.employeeId}
                  onChange={e => setForm({...form, employeeId: e.target.value})}
                >
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Month</label>
                  <select 
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                    value={form.month}
                    onChange={e => setForm({...form, month: e.target.value})}
                  >
                    {["2024-12", "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", 
                      "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11"].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Days</label>
                  <input 
                    type="number" 
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                    value={form.days}
                    onChange={e => setForm({...form, days: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Reason</label>
                <select 
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                  value={form.reason}
                  onChange={e => setForm({...form, reason: e.target.value as any})}
                >
                  <option>Maternity</option>
                  <option>Sickness</option>
                  <option>WIC</option>
                  <option>Unpaid</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Pay Rule</label>
                <select 
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm border p-2 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                  value={form.payRule}
                  onChange={e => setForm({...form, payRule: e.target.value as any})}
                >
                  <option value="4/5">Statutory 4/5 Pay</option>
                  <option value="No Pay">No Pay</option>
                  <option value="Full Pay">Full Pay</option>
                </select>
              </div>
              <button 
                onClick={handleSubmit}
                className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition-colors font-medium mt-2"
              >
                Confirm & Update Payroll
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MPFTab: React.FC<{ employees: Employee[], history: PayrollRecord[] }> = ({ employees, history }) => {
  const [selectedMonth, setSelectedMonth] = useState('2025-11');
  
  const records = history.filter(h => h.period === selectedMonth);
  
  return (
    <div className="space-y-4">
       <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <label className="text-sm font-medium text-slate-700">Select Contribution Period:</label>
        <select 
          className="block w-48 pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md border"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
           {["2024-12", "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", 
             "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11"].map(m => (
             <option key={m} value={m}>{m}</option>
           ))}
        </select>
      </div>

      <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Scheme</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Relevant Income</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">ER Mandatory</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">EE Mandatory</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Voluntary</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total Remittance</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {records.map(rec => {
              const emp = employees.find(e => e.id === rec.employeeId);
              if (!emp) return null;
              const total = rec.mpfEmployerMandatory + rec.mpfEmployeeMandatory + rec.mpfEmployeeVoluntary;
              return (
                <tr key={rec.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {emp.name} <span className="text-xs text-slate-400 block">{emp.role}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                    {emp.mpfScheme}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900 font-medium">
                    ${rec.mpfRelevantIncome.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-600">
                    ${rec.mpfEmployerMandatory}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-600">
                    ${rec.mpfEmployeeMandatory}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-400">
                    ${rec.mpfEmployeeVoluntary}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-emerald-600 font-bold">
                    ${total.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SalaryReportTab: React.FC<{ employees: Employee[], history: PayrollRecord[] }> = ({ employees, history }) => {
  const [selectedMonth, setSelectedMonth] = useState('2025-11');
  const records = history.filter(h => h.period === selectedMonth);
  
  const totalGross = records.reduce((sum, r) => sum + r.grossPay, 0);
  const totalNet = records.reduce((sum, r) => sum + r.netPay, 0);

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700">Pay Run Month:</label>
          <select 
            className="block w-48 pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md border"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {["2024-12", "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", 
              "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11"].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-6">
           <div className="text-right">
             <div className="text-xs text-slate-500 uppercase">Total Gross</div>
             <div className="text-lg font-bold text-slate-900">${totalGross.toLocaleString()}</div>
           </div>
           <div className="text-right">
             <div className="text-xs text-slate-500 uppercase">Total Net Pay</div>
             <div className="text-lg font-bold text-emerald-600">${totalNet.toLocaleString()}</div>
           </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Gross Pay</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">MPF (EE)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Voluntary</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Net Pay</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {records.map(rec => {
               const emp = employees.find(e => e.id === rec.employeeId);
               return (
                <tr key={rec.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{emp?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-600">${rec.grossPay.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">-${rec.mpfEmployeeMandatory.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-400">-${rec.mpfEmployeeVoluntary.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-emerald-600">${rec.netPay.toLocaleString()}</td>
                </tr>
               )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const IR56BTab: React.FC<{ employees: Employee[], history: PayrollRecord[] }> = ({ employees, history }) => {
  const xml = useMemo(() => generateIR56BXML(employees, history, '2025-03-31'), [employees, history]);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2">
          <Code size={16}/> IR56B Specification Compliance
        </h3>
        <p className="text-xs text-blue-700 mt-1">
          Generated XML adheres to IRD specific formatting, including Employee Header blocks, Income Particulars (Code A), and simplified Particulars of Income. Date format: YYYYMMDD.
        </p>
      </div>
      <div className="relative flex-1 bg-slate-900 rounded-lg overflow-hidden shadow-inner border border-slate-700">
        <pre className="p-4 text-xs text-green-400 font-mono overflow-auto h-[500px]">
          {xml}
        </pre>
        <button 
          className="absolute top-4 right-4 bg-white text-slate-900 hover:bg-slate-100 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 shadow"
          onClick={() => navigator.clipboard.writeText(xml)}
        >
          Copy XML
        </button>
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [history, setHistory] = useState<PayrollRecord[]>([]);
  const [disregarded, setDisregarded] = useState<DisregardedPeriod[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Init Data
    const emps = generateEmployees();
    const { records, disregarded: initDisregarded } = generateInitialHistory(emps);
    setEmployees(emps);
    setHistory(records);
    setDisregarded(initDisregarded);
  }, []);

  const handleRecalculate = () => {
    setLoading(true);
    setTimeout(() => {
      // In a real app, this would re-run the engine logic across all records based on new rules
      // For MVP, we simulate a refresh
      setLoading(false);
    }, 800);
  };

  const handleAddDisregarded = (newPeriod: Omit<DisregardedPeriod, 'id'>) => {
    setLoading(true);
    setTimeout(() => {
      const newId = Math.random().toString(36).substr(2, 9);
      const fullPeriod = { ...newPeriod, id: newId };
      setDisregarded(prev => [...prev, fullPeriod]);

      // Update History Logic
      setHistory(prev => prev.map(rec => {
        if (rec.employeeId === newPeriod.employeeId && rec.period === newPeriod.month) {
          let newGross = rec.grossPay;
          // Simplified update logic: If pay rule is 4/5, reduce gross. 
          // In a real app, this logic is complex (reverse calc daily rate -> apply factor).
          // For MVP demo:
          if (newPeriod.payRule === '4/5') newGross = rec.grossPay * 0.8;
          if (newPeriod.payRule === 'No Pay') newGross = 0;

          return {
            ...rec,
            isDisregarded: true,
            disregardedReason: newPeriod.reason,
            disregardedDays: newPeriod.days,
            disregardedPay: newPeriod.payRule === 'No Pay' ? 0 : (newPeriod.payRule === '4/5' ? newGross : rec.grossPay),
            grossPay: newGross,
            mpfRelevantIncome: newGross,
            // Recalc Net (Simplified)
            netPay: newGross - rec.mpfEmployeeMandatory - rec.mpfEmployeeVoluntary
          };
        }
        return rec;
      }));
      setLoading(false);
    }, 500);
  };

  const handleExportCSV = () => {
    const headers = Object.keys(history[0]).join(',');
    const rows = history.map(r => Object.values(r).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payroll_export_mvp.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 text-white p-2 rounded-lg">
                <Calculator size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">HK SME Payroll</h1>
                <p className="text-xs text-slate-500">Compliance Core MVP • 713 Engine • IR56B</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleRecalculate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                {loading ? 'Calculating...' : 'Recalculate Engine'}
              </button>
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-transparent rounded-md text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            <TabButton active={activeTab === 0} label="Profile" icon={<Users size={16}/>} onClick={() => setActiveTab(0)} />
            <TabButton active={activeTab === 1} label="713 ADW Engine" icon={<Calculator size={16}/>} onClick={() => setActiveTab(1)} />
            <TabButton active={activeTab === 2} label="Disregarded Audit" icon={<AlertTriangle size={16}/>} onClick={() => setActiveTab(2)} />
            <TabButton active={activeTab === 3} label="MPF Calculator" icon={<PiggyBank size={16}/>} onClick={() => setActiveTab(3)} />
            <TabButton active={activeTab === 4} label="Salary Report" icon={<FileText size={16}/>} onClick={() => setActiveTab(4)} />
            <TabButton active={activeTab === 6} label="Payroll Calendar" icon={<Calendar size={16}/>} onClick={() => setActiveTab(6)} />
            <TabButton active={activeTab === 5} label="IR56B XML" icon={<Code size={16}/>} onClick={() => setActiveTab(5)} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 0 && <ProfileTab employees={employees} />}
        {activeTab === 1 && <ADWTab employees={employees} history={history} />}
        {activeTab === 2 && <DisregardedTab disregarded={disregarded} employees={employees} onAdd={handleAddDisregarded} />}
        {activeTab === 3 && <MPFTab employees={employees} history={history} />}
        {activeTab === 4 && <SalaryReportTab employees={employees} history={history} />}
        {activeTab === 6 && <CalendarTab />}
        {activeTab === 5 && <IR56BTab employees={employees} history={history} />}
      </main>
    </div>
  );
};

export default App;