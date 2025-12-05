import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, rightElement, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
          {label}
        </label>
      )}
      <div className="relative group">
        <input
          className={`
            w-full bg-klaus-gray border-l-4 border-transparent
            text-white placeholder-gray-600 px-4 py-3
            focus:outline-none focus:border-klaus-red focus:bg-black
            transition-all duration-300
            ${error ? 'border-red-500' : ''}
            ${rightElement ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />
        {/* Subtle grid pattern overlay hint */}
        <div className="absolute inset-0 border border-gray-800 pointer-events-none group-focus-within:border-gray-700 transition-colors" />
        
        {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 z-10 flex items-center">
                {rightElement}
            </div>
        )}
      </div>
      {error && <span className="text-klaus-red text-xs mt-1 block">{error}</span>}
    </div>
  );
};