import FormField from './FormField';

interface TextAreaProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  label?: string;
  error?: string;
  required?: boolean;
}

const TextArea: React.FC<TextAreaProps> = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  disabled = false,
  rows = 4,
  maxLength,
  label,
  error,
  required,
}) => {
  const textarea = (
    <div className="relative">
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={`
          w-full px-5 py-3.5 rounded-2xl text-base
          bg-muted backdrop-blur-sm border border-border transition-all duration-300
          text-foreground placeholder:text-muted-foreground resize-none
          focus:outline-none focus:bg-muted/80 focus:ring-4 focus:ring-primary/10 focus:border-primary/50
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-lg shadow-black/5 hover:shadow-black/10
          hover:border-primary/20 hover:bg-muted/80
        `}
      />
      {maxLength && (
        <div className="absolute bottom-2 right-3 text-xs text-muted-foreground">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );

  if (label) {
    return (
      <FormField label={label} htmlFor={id} required={required} error={error}>
        {textarea}
      </FormField>
    );
  }

  return textarea;
};

export default TextArea;
