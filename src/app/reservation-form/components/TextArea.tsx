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
          bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-300
          text-white placeholder:text-white/50 resize-none
          focus:outline-none focus:bg-white/10 focus:ring-4 focus:ring-primary/10 focus:border-primary/50
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-lg shadow-black/5 hover:shadow-black/10
          hover:border-white/20 hover:bg-white/10
        `}
      />
      {maxLength && (
        <div className="absolute bottom-2 right-3 text-xs text-white/40">
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
