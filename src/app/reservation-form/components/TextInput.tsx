import FormField from './FormField';

interface TextInputProps {
  id: string;
  name: string;
  type?: 'text' | 'tel' | 'email';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean | string; // Allow string for error message
  success?: boolean;
  maxLength?: number;
  pattern?: string;
  label?: string;
  required?: boolean;
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
  label,
  required,
}) => {
  const input = (
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
      required={required}
      className={`
        w-full px-5 py-3.5 rounded-2xl text-base
        bg-muted backdrop-blur-sm border border-border transition-all duration-300
        text-foreground placeholder:text-muted-foreground
        focus:outline-none focus:bg-muted/80 focus:ring-4 focus:ring-primary/10 focus:border-primary/50
        min-h-[56px]
        ${error ? 'border-error/50 bg-error/5' : success ? 'border-success/50 bg-success/5' : 'hover:border-primary/20 hover:bg-muted/80'}
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-lg shadow-black/5 hover:shadow-black/10
      `}
    />
  );

  if (label) {
    return (
      <FormField
        label={label}
        htmlFor={id}
        required={required}
        error={typeof error === 'string' ? error : undefined}
        success={success}
      >
        {input}
      </FormField>
    );
  }

  return input;
};

export default TextInput;
