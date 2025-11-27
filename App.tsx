import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Trash2,
  Edit,
  Info
} from 'lucide-react';

// --- Custom UI Components ---

const EmployeeSelect: React.FC<{
  employees: Employee[];
  selectedId: string;
  onChange: (id: string) => void;
  label?: string;
}> = ({ employees, selectedId, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedEmp = employees.find(e => e.id === selectedId) || employees[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
      >
        <div className="flex items-center">
          <img src={selectedEmp.profilePicture} alt="" className="flex-shrink-0 h-6 w-6 rounded-full" />
          <span className="ml-3 block truncate text-slate-900 dark:text-white">{selectedEmp.name}</span>
        </div>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 shadow-lg max-h-56 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {employees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => {
                onChange(emp.id);
                setIsOpen(false);
              }}
              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-slate-100 dark:hover:bg-slate-700 ${
                emp.id === selectedId ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
              }`}
            >
              <div className="flex items-center">
                <img src={emp.profilePicture} alt="" className="flex-shrink-0 h-6 w-6 rounded-full" />
                <span className={`ml-3 block truncate ${emp.id === selectedId ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-300'}`}>
                  {emp.name}
                </span>
              </div>
              {emp.id === selectedId && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-4 w-4" />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Tab Components ---

const ProfileTab: React.FC<{ employees: Employee[] }> = ({ employees }) => (
  <div className="overflow-x-auto bg-white dark:bg-slate-800 shadow rounded-lg border border-slate-200 dark:border-slate-700">
    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
      <thead className="bg-slate-50 dark:bg-slate-900">
        <tr>
          {['Employee', 'HKID', 'Role', 'Type', 'Contact', 'Base Rate', 'MPF Scheme', 'MPF % (ER/EE)', 'Join Date'].map(h => (
            <th key={h} className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
        {employees.map((emp) => (
          <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white flex items-center gap-3">
              <img src={emp.profilePicture} alt={emp.name} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 object-cover" />
              <div>
                <div className="font-bold">{emp.name}</div>
                <div className="text-xs text-slate-400 font-normal">{emp.id}</div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{emp.hkid}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${emp.role === EmployeeRole.Manager ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                {emp.role}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{emp.paymentType}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{emp.contactNumber}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">${emp.baseRate.toLocaleString()}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 text-xs">{emp.mpfScheme}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
              {emp.mpfScheme === MPFScheme.MasterTrust ? (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs"><span className="font-semibold text-slate-700 dark:text-slate-300">ER:</span> 5%</span>
                  <span className="text-xs flex items-center gap-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">EE:</span> 5%
                    {emp.voluntaryContributionRate > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-1 bg-emerald-100 dark:bg-emerald-900/30 rounded">
                        +{emp.voluntaryContributionRate}% Vol
                      </span>
                    )}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">Industry Scale</span>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{emp.joinDate}</td>
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
      events.push({ title: "MPF Submission Due", color: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800" });
    }

    // Pay Run (Last day of month)
    if (d === daysInMonth) {
      events.push({ title: "Pay Run Completion", color: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" });
    }

    // IR56B (April 15th usually, using April 1st as start of tax filing awareness)
    if (month === 3 && d === 1) { // April 1st
      events.push({ title: "Tax Year Start", color: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800" });
    }
    if (month === 3 && d === 15) { // April 15th
      events.push({ title: "IR56B Filing Deadline", color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700" });
    }

    return events;
  };

  const days = [];
  // Padding for previous month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50 dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-700"></div>);
  }
  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const events = getEvents(d);
    days.push(
      <div key={d} className="h-32 bg-white dark:bg-slate-800 border-b border-r border-slate-200 dark:border-slate-700 p-2 relative hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
        <span className={`text-sm font-medium ${events.length > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>{d}</span>
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
    <div className="space-y-4">
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-md border border-indigo-200 dark:border-indigo-800 text-sm">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-100">Payroll Calendar Events</h4>
            <p className="text-xs text-indigo-800 dark:text-indigo-200">
              Tracking key compliance dates including <strong>MPF Submission Deadlines</strong> (10th of following month), <strong>Pay Run Completion</strong> (Month End), and annual <strong>IR56B Tax Filing</strong> windows.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarIcon size={20} className="text-emerald-600 dark:text-emerald-400"/> 
            Payroll Calendar
          </h2>
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300"><ChevronLeft size={20}/></button>
            <span className="text-lg font-medium w-32 text-center text-slate-900 dark:text-white">{monthNames[month]} {year}</span>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300"><ChevronRight size={20}/></button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 border-l border-slate-200 dark:border-slate-700">
          {days}
        </div>
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
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="w-full md:w-80">
          <EmployeeSelect 
            employees={employees}
            selectedId={selectedEmpId}
            onChange={setSelectedEmpId}
            label="Select Employee to Calculate ADW"
          />
        </div>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-md border border-emerald-200 dark:border-emerald-800 text-sm">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-100">713 Ordinance Calculation Logic</h4>
            <p className="text-xs text-emerald-800 dark:text-emerald-200">
              The 12-Month Average Daily Wage (ADW) is calculated by dividing <strong>Total Wages</strong> by <strong>Total Days</strong> over the past year.
              Critically, periods where the employee was not paid their full wages (e.g., statutory holidays, sickness allowance at 4/5) are <strong>excluded</strong> from both the numerator and denominator to protect the employee's average.
            </p>
          </div>
        </div>
      </div>

      {result && emp && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="px-4 py-5 sm:px-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4">
                <img src={emp.profilePicture} alt={emp.name} className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-700 shadow-sm" />
                <div>
                  <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">713 ADW Ledger: {emp.name}</h3>
                  <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Calculation period: Last 12 months from latest record.</p>
                </div>
              </div>
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Period</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Gross Pay</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Work Days</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Excl. Pay</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Excl. Days</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {result.details.map((d: any) => (
                    <tr key={d.period} className={d.excluded ? "bg-red-50 dark:bg-red-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-700/50"}>
                      <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-300">{d.period}</td>
                      <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-400">${d.gross.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-400">{d.days}</td>
                      <td className="px-4 py-3 text-sm text-center">
                         {d.excluded ? (
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                             Disregarded
                           </span>
                         ) : <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">Included</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400">
                        {d.excluded ? `-$${d.excludedPay.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400">
                        {d.excluded ? `-${d.excludedDays}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 shadow rounded-lg border border-slate-200 dark:border-slate-700 h-fit">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Calculation Summary</h3>
            <dl className="space-y-4">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <dt className="text-sm text-slate-500 dark:text-slate-400">Total Wages (12M)</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white">${result.grossTotal.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <dt className="text-sm text-slate-500 dark:text-slate-400">Less: Excluded Wages</dt>
                <dd className="text-sm font-medium text-red-600 dark:text-red-400">-${result.excludedPay.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <dt className="text-sm text-slate-500 dark:text-slate-400">Net Wages (A)</dt>
                <dd className="text-sm font-bold text-slate-900 dark:text-white">${(result.grossTotal - result.excludedPay).toLocaleString()}</dd>
              </div>
              
              <div className="pt-4 flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <dt className="text-sm text-slate-500 dark:text-slate-400">Total Days (12M)</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white">{result.daysTotal}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <dt className="text-sm text-slate-500 dark:text-slate-400">Less: Excluded Days</dt>
                <dd className="text-sm font-medium text-red-600 dark:text-red-400">-{result.excludedDays}</dd>
              </div>
               <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <dt className="text-sm text-slate-500 dark:text-slate-400">Net Days (B)</dt>
                <dd className="text-sm font-bold text-slate-900 dark:text-white">{result.daysTotal - result.excludedDays}</dd>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <dt className="text-base font-bold text-slate-900 dark:text-white">Average Daily Wage</dt>
                <dd className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${result.finalADW.toLocaleString()}</dd>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">Formula: (A) / (B)</p>
            </dl>

            {result.details.filter((d: any) => d.excluded).length > 0 && (
              <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded border border-yellow-200 dark:border-yellow-800">
                <h4 className="text-xs font-bold text-yellow-800 dark:text-yellow-500 uppercase mb-2">Identified Disregarded Periods</h4>
                <ul className="list-disc pl-4 space-y-1">
                  {result.details.filter((d: any) => d.excluded).map((d: any, i: number) => (
                    <li key={i} className="text-xs text-yellow-800 dark:text-yellow-400">
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
  onAdd: (d: Omit<DisregardedPeriod, 'id'>) => void,
  onEdit: (d: DisregardedPeriod) => void,
  onDelete: (id: string) => void
}> = ({ disregarded, employees, onAdd, onEdit, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<DisregardedPeriod>>({
    employeeId: employees[0].id,
    month: '2025-11',
    reason: 'Sickness',
    days: 1,
    payRule: '4/5'
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      employeeId: employees[0].id,
      month: '2025-11',
      reason: 'Sickness',
      days: 1,
      payRule: '4/5'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (period: DisregardedPeriod) => {
    setEditingId(period.id);
    setForm({
      employeeId: period.employeeId,
      month: period.month,
      reason: period.reason,
      days: period.days,
      payRule: period.payRule
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if(form.employeeId && form.month && form.reason && form.days && form.payRule) {
      if (editingId) {
        onEdit({ ...form, id: editingId } as DisregardedPeriod);
      } else {
        onAdd(form as Omit<DisregardedPeriod, 'id'>);
      }
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Disregarded Periods Audit Log</h2>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm"
        >
          <PlusCircle size={16} /> Add Period
        </button>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800 text-sm">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold text-yellow-900 dark:text-yellow-100">Disregarded Events & 713 Compliance</h4>
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              Events listed here (e.g. Maternity Leave, Sickness Allowance) trigger the "Disregarded" flag.
              Both the <strong>period (days)</strong> and the <strong>pay</strong> are excluded from the 12-month Average Daily Wage (ADW) calculation to prevent lowering the employee's statutory average rate.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-900">
             <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Pay Rule</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
             </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {disregarded.map(d => {
               const emp = employees.find(e => e.id === d.employeeId);
               return (
                 <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white flex items-center gap-3">
                     <img src={emp?.profilePicture} alt="" className="w-8 h-8 rounded-full" />
                     <div>
                       <div>{emp?.name}</div>
                       <div className="text-slate-400 text-xs font-normal">{emp?.hkid}</div>
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{d.month}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                       {d.reason}
                     </span>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{d.days}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{d.payRule}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                     <div className="flex items-center justify-end gap-2">
                       <button 
                        onClick={() => handleOpenEdit(d)}
                        className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" title="Edit">
                         <Edit size={16} />
                       </button>
                       <button 
                        onClick={() => onDelete(d.id)}
                        className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete">
                         <Trash2 size={16} />
                       </button>
                     </div>
                   </td>
                 </tr>
               );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in-up border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{editingId ? 'Edit Disregarded Period' : 'Add Disregarded Period'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <EmployeeSelect 
                  employees={employees} 
                  selectedId={form.employeeId!} 
                  onChange={id => setForm({...form, employeeId: id})}
                  label="Employee" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Month</label>
                  <select 
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm border p-2 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
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
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Days</label>
                  <input 
                    type="number" 
                    className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm border p-2 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                    value={form.days}
                    onChange={e => setForm({...form, days: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Reason</label>
                <select 
                  className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm border p-2 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Pay Rule</label>
                <select 
                  className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm border p-2 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
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
                className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition-colors font-medium mt-2 shadow-sm"
              >
                {editingId ? 'Update Period' : 'Confirm & Update Payroll'}
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
       <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Contribution Period:</label>
        <select 
          className="block w-48 pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md border"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
           {["2024-12", "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", 
             "2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11"].map(m => (
             <option key={m} value={m}>{m}</option>
           ))}
        </select>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-md border border-indigo-200 dark:border-indigo-800 text-sm">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-100">MPF Calculation Logic & Voluntary Contributions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-indigo-800 dark:text-indigo-200 text-xs">
              <div>
                 <p className="font-bold mb-1 uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Master Trust (Monthly)</p>
                 <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                   <li><strong>Mandatory (ER/EE):</strong> 5% of Relevant Income.</li>
                   <li><strong>Caps:</strong> Max contribution $1,500/mth (Income ≥ $30,000).</li>
                   <li><strong>Exemption:</strong> EE contribution is $0 if Income &lt; $7,100.</li>
                   <li><strong>Voluntary:</strong> Additional % defined in Employee Profile (e.g., +5%).</li>
                 </ul>
              </div>
              <div>
                 <p className="font-bold mb-1 uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Industry Scheme (Casual)</p>
                 <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                   <li><strong>Scale-based:</strong> Fixed daily amounts based on income bands.</li>
                   <li>e.g., Daily Inc &lt; $280: ER $10 / EE $0.</li>
                   <li>e.g., Daily Inc $280-$349: ER $10 / EE $10.</li>
                   <li><strong>Voluntary:</strong> Calculated as fixed % on top of scale amounts.</li>
                 </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Scheme</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Relevant Income</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">ER Mandatory</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">EE Mandatory</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">EE Voluntary</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Total Remittance</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {records.map(rec => {
              const emp = employees.find(e => e.id === rec.employeeId);
              if (!emp) return null;
              const total = rec.mpfEmployerMandatory + rec.mpfEmployeeMandatory + rec.mpfEmployeeVoluntary;
              return (
                <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white flex items-center gap-3">
                    <img src={emp.profilePicture} alt="" className="w-8 h-8 rounded-full" />
                    <div>
                      <div>{emp.name}</div>
                      <div className="text-xs text-slate-400">{emp.role}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                    {emp.mpfScheme}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900 dark:text-slate-200 font-medium">
                    ${rec.mpfRelevantIncome.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-600 dark:text-slate-400">
                    ${rec.mpfEmployerMandatory}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-600 dark:text-slate-400">
                    ${rec.mpfEmployeeMandatory}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-400">
                    ${rec.mpfEmployeeVoluntary}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-emerald-600 dark:text-emerald-400 font-bold">
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
       <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Pay Run Month:</label>
          <select 
            className="block w-48 pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md border"
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
             <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Total Gross</div>
             <div className="text-lg font-bold text-slate-900 dark:text-white">${totalGross.toLocaleString()}</div>
           </div>
           <div className="text-right">
             <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Total Net Pay</div>
             <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">${totalNet.toLocaleString()}</div>
           </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-800 text-sm">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h4 className="font-bold text-blue-900 dark:text-blue-100">Net Pay Calculation Formula</h4>
            <p className="font-mono text-xs bg-white dark:bg-slate-900/50 px-2 py-1 rounded border border-blue-100 dark:border-blue-800 inline-block text-blue-800 dark:text-blue-200">
              Net Pay = Gross Pay - MPF (Mandatory) - MPF (Voluntary)
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              <strong>713 Ordinance Note:</strong> Portions of Gross Pay (e.g., Sickness Allowance paid at 4/5) flagged as <span className="text-orange-600 dark:text-orange-400 font-medium">Disregarded Pay</span> are to be <strong>excluded</strong> from future Average Daily Wage (ADW) calculations. These amounts are <strong>already included</strong> in the Gross Pay figure and are taxable/MPF-relevant; they are NOT deducted from the Net Pay.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 shadow rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Employee</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Gross Pay</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">MPF (EE)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Voluntary</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Net Pay</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {records.map(rec => {
               const emp = employees.find(e => e.id === rec.employeeId);
               return (
                <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white flex items-center gap-3">
                    <img src={emp?.profilePicture} alt="" className="w-8 h-8 rounded-full" />
                    <span>{emp?.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-600 dark:text-slate-400">${rec.grossPay.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400">-${rec.mpfEmployeeMandatory.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-400">-${rec.mpfEmployeeVoluntary.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-emerald-600 dark:text-emerald-400">${rec.netPay.toLocaleString()}</td>
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
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
          <Code size={16}/> IR56B Specification Compliance
        </h3>
        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
          Generated XML adheres to IRD specific formatting, including Employee Header blocks, Income Particulars (Code A), and simplified Particulars of Income. Date format: YYYYMMDD.
        </p>
      </div>
      <div className="relative bg-slate-900 rounded-lg overflow-hidden shadow-inner border border-slate-700">
        <pre className="p-4 text-xs text-green-400 font-mono overflow-auto h-auto max-h-[calc(100vh-250px)]">
          {xml}
        </pre>
        <button 
          className="absolute top-4 right-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 shadow transition-colors"
          onClick={() => navigator.clipboard.writeText(xml)}
        >
          Copy XML
        </button>
      </div>
    </div>
  );
};

// --- Main App Component ---

// Helper for MPF calculation to be reused
const calculateMPF = (scheme: MPFScheme, gross: number, days: number = 30) => {
  let erMandatory = 0;
  let eeMandatory = 0;

  if (scheme === MPFScheme.MasterTrust) {
     if (gross > 30000) {
        eeMandatory = 1500;
        erMandatory = 1500;
     } else if (gross < 7100) {
        eeMandatory = 0;
        erMandatory = gross * 0.05;
     } else {
        eeMandatory = gross * 0.05;
        erMandatory = gross * 0.05;
     }
  } else {
      // Simplified Industry Scheme Band Logic
      const dailyAvg = gross / (days || 1);
      let erDaily = 0;
      let eeDaily = 0;
      
      if (dailyAvg < 280) { erDaily = 10; eeDaily = 0; }
      else if (dailyAvg < 350) { erDaily = 10; eeDaily = 10; }
      else if (dailyAvg < 650) { erDaily = 20; eeDaily = 20; }
      else { erDaily = Math.min(50, dailyAvg * 0.05); eeDaily = Math.min(50, dailyAvg * 0.05); }

      erMandatory = erDaily * days;
      eeMandatory = eeDaily * days;
  }
  return { erMandatory, eeMandatory };
};

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
      setLoading(false);
    }, 800);
  };

  const recalculatePayrollRecord = (
    rec: PayrollRecord, 
    emp: Employee, 
    newGross: number, 
    isDisregarded: boolean, 
    disregardedReason?: string, 
    disregardedDays: number = 0, 
    disregardedPay: number = 0
  ): PayrollRecord => {
    const { erMandatory, eeMandatory } = calculateMPF(emp.mpfScheme, newGross, rec.totalDays);
    const eeVoluntary = newGross * (emp.voluntaryContributionRate / 100);

    return {
      ...rec,
      isDisregarded,
      disregardedReason,
      disregardedDays,
      disregardedPay,
      grossPay: Math.round(newGross),
      mpfRelevantIncome: Math.round(newGross),
      mpfEmployerMandatory: Math.round(erMandatory),
      mpfEmployeeMandatory: Math.round(eeMandatory),
      mpfEmployeeVoluntary: Math.round(eeVoluntary),
      netPay: Math.round(newGross - eeMandatory - eeVoluntary)
    };
  };

  const handleAddDisregarded = (newPeriod: Omit<DisregardedPeriod, 'id'>) => {
    setLoading(true);
    setTimeout(() => {
      const newId = Math.random().toString(36).substr(2, 9);
      const fullPeriod = { ...newPeriod, id: newId };
      setDisregarded(prev => [...prev, fullPeriod]);

      setHistory(prev => prev.map(rec => {
        if (rec.employeeId === newPeriod.employeeId && rec.period === newPeriod.month) {
          const emp = employees.find(e => e.id === rec.employeeId);
          if (!emp) return rec;

          // Determine proportional pay
          const totalDays = rec.totalDays; // Assuming 30 for Monthly, or work days for Casual
          // For casual, baseRate is daily. For monthly, it's monthly.
          const dailyRate = emp.paymentType === PaymentType.Monthly ? (emp.baseRate / 30) : emp.baseRate;

          // Days logic
          const affectedDays = Math.min(newPeriod.days, totalDays);
          const normalDays = totalDays - affectedDays;
          
          const normalPay = normalDays * dailyRate;
          let periodPay = 0;
          
          if (newPeriod.payRule === '4/5') periodPay = affectedDays * dailyRate * 0.8;
          else if (newPeriod.payRule === 'Full Pay') periodPay = affectedDays * dailyRate;
          else if (newPeriod.payRule === 'No Pay') periodPay = 0;
          
          const newGross = normalPay + periodPay;

          return recalculatePayrollRecord(
            rec, emp, newGross, true, newPeriod.reason, affectedDays, periodPay
          );
        }
        return rec;
      }));
      setLoading(false);
    }, 500);
  };

  const handleEditDisregarded = (updatedPeriod: DisregardedPeriod) => {
    setLoading(true);
    setTimeout(() => {
      // Update disregarded list
      setDisregarded(prev => prev.map(d => d.id === updatedPeriod.id ? updatedPeriod : d));

      // Update history
      setHistory(prev => prev.map(rec => {
        if (rec.employeeId === updatedPeriod.employeeId && rec.period === updatedPeriod.month) {
          const emp = employees.find(e => e.id === rec.employeeId);
          if (!emp) return rec;

          // Re-apply proportional logic (same as Add)
          const totalDays = rec.totalDays;
          const dailyRate = emp.paymentType === PaymentType.Monthly ? (emp.baseRate / 30) : emp.baseRate;
          
          const affectedDays = Math.min(updatedPeriod.days, totalDays);
          const normalDays = totalDays - affectedDays;
          
          const normalPay = normalDays * dailyRate;
          let periodPay = 0;
          
          if (updatedPeriod.payRule === '4/5') periodPay = affectedDays * dailyRate * 0.8;
          else if (updatedPeriod.payRule === 'Full Pay') periodPay = affectedDays * dailyRate;
          else if (updatedPeriod.payRule === 'No Pay') periodPay = 0;

          const newGross = normalPay + periodPay;

          return recalculatePayrollRecord(
            rec, emp, newGross, true, updatedPeriod.reason, affectedDays, periodPay
          );
        }
        return rec;
      }));
      setLoading(false);
    }, 500);
  };

  const handleDeleteDisregarded = (id: string) => {
    setLoading(true);
    setTimeout(() => {
      const target = disregarded.find(d => d.id === id);
      if (!target) { setLoading(false); return; }

      // Remove from list
      setDisregarded(prev => prev.filter(d => d.id !== id));

      // Restore history to normal
      setHistory(prev => prev.map(rec => {
        if (rec.employeeId === target.employeeId && rec.period === target.month) {
          const emp = employees.find(e => e.id === rec.employeeId);
          if (!emp) return rec;

          // Restore to full normal pay
          const normalGross = emp.paymentType === PaymentType.Monthly ? emp.baseRate : (rec.totalDays * emp.baseRate);
          
          return recalculatePayrollRecord(
            rec, emp, normalGross, false, undefined, 0, 0
          );
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 text-white p-2 rounded-lg">
                <Calculator size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">HK SME Payroll</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Compliance Core MVP • 713 Engine • IR56B</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleRecalculate}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                {loading ? 'Calculating...' : 'Recalculate Engine'}
              </button>
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-slate-800 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            <TabButton active={activeTab === 0} label="Profile" icon={<Users size={16}/>} onClick={() => setActiveTab(0)} />
            <TabButton active={activeTab === 1} label="713 ADW Engine" icon={<Calculator size={16}/>} onClick={() => setActiveTab(1)} />
            <TabButton active={activeTab === 2} label="Disregarded Audit" icon={<AlertTriangle size={16}/>} onClick={() => setActiveTab(2)} />
            {/* SWAPPED ORDER: Salary Report first */}
            <TabButton active={activeTab === 4} label="Salary Report" icon={<FileText size={16}/>} onClick={() => setActiveTab(4)} />
            {/* SWAPPED ORDER: MPF Calculator second */}
            <TabButton active={activeTab === 3} label="MPF Calculator" icon={<PiggyBank size={16}/>} onClick={() => setActiveTab(3)} />
            <TabButton active={activeTab === 6} label="Payroll Calendar" icon={<CalendarIcon size={16}/>} onClick={() => setActiveTab(6)} />
            <TabButton active={activeTab === 5} label="IR56B XML" icon={<Code size={16}/>} onClick={() => setActiveTab(5)} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 0 && <ProfileTab employees={employees} />}
        {activeTab === 1 && <ADWTab employees={employees} history={history} />}
        {activeTab === 2 && (
          <DisregardedTab 
            disregarded={disregarded} 
            employees={employees} 
            onAdd={handleAddDisregarded} 
            onEdit={handleEditDisregarded}
            onDelete={handleDeleteDisregarded}
          />
        )}
        {activeTab === 3 && <MPFTab employees={employees} history={history} />}
        {activeTab === 4 && <SalaryReportTab employees={employees} history={history} />}
        {activeTab === 6 && <CalendarTab />}
        {activeTab === 5 && <IR56BTab employees={employees} history={history} />}
      </main>
    </div>
  );
};

export default App;