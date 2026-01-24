import React from 'react';

interface TextInputProps {
  id: string;
  name: string;
  type?: 'text' | 'tel' | 'email';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  success?: boolean;
  maxLength?: number;
  pattern?: string;
}

const TextInput: React.FC<TextInputProps> = ({
  id,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  disabled = false,
  error = false,
  success = false,
  maxLength,
  pattern,
}) => {
  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      pattern={pattern}
      className={`
        w-full px-4 py-3 rounded-md text-base
        bg-input border-2 transition-smooth
        placeholder:text-muted-foreground
        focus:outline-none focus:ring-2 focus:ring-ring
        disabled:opacity-50 disabled:cursor-not-allowed
        min-h-[44px]
        ${error ? 'border-error' : success ? 'border-success' : 'border-border'}
        ${!disabled && 'hover:border-primary/50'}
      `}
    />
  );
};

export default TextInput;
