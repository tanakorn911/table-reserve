import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  success?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  success,
  children,
  htmlFor,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-base font-medium text-foreground flex items-center gap-1"
      >
        {label}
        {required && <span className="text-error">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-error flex items-start gap-1.5">
          <span className="mt-0.5">⚠</span>
          <span>{error}</span>
        </p>
      )}
      {success && !error && (
        <p className="text-sm text-success flex items-center gap-1.5">
          <span>✓</span>
          <span>ถูกต้อง</span>
        </p>
      )}
    </div>
  );
};

export default FormField;
