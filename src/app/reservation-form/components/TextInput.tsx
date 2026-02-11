import FormField from './FormField';

interface TextInputProps {
  id: string; // ID ของ Input
  name: string; // ชื่อ Field
  type?: 'text' | 'tel' | 'email'; // ประเภท Input
  value: string; // ค่าปัจจุบัน
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // ฟังก์ชันเปลี่ยนค่า
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void; // ฟังก์ชันเมื่อหลุดโฟกัส
  placeholder?: string; // ข้อความ Placeholder
  disabled?: boolean; // ปิดการใช้งาน
  error?: boolean | string; // รองรับทั้ง boolean (มี error แต่ไม่บอกข้อความ) และ string (ระบุข้อความ error)
  success?: boolean; // แสดงสถานะสำเร็จ
  maxLength?: number; // จำนวนตัวอักษรสูงสุด
  pattern?: string; // Regex Pattern
  label?: string; // ถ้ามี label จะถูกห่อด้วย FormField
  required?: boolean; // จำเป็นต้องกรอก?
}

/**
 * TextInput Component
 * ช่องกรอกข้อความแบบบรรทัดเดียวมาตรฐาน
 * - รองรับประเภท Text, Tel, Email
 * - รองรับ Error/Success States
 * - รองรับ Dark Mode และ Styling มาตรฐาน
 */
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

  // ถ้ามี Label ให้ห่อด้วย FormField
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
