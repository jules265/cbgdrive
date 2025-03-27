import  { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...rest }: InputProps) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium mb-1" htmlFor={rest.id}>
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${
          error ? 'border-red-500' : ''
        } ${className}`}
        {...rest}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
 