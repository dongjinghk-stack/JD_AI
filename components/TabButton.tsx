import React from 'react';

interface TabButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export const TabButton: React.FC<TabButtonProps> = ({ active, label, onClick, icon }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 border-b-2 ${
        active
          ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
};