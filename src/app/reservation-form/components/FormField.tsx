import React from 'react';
import { useNavigation } from '@/contexts/NavigationContext';

interface FormFieldProps {
  label: React.ReactNode; // ข้อความ Label
  required?: boolean; // จำเป็นต้องกรอกหรือไม่
  error?: string; // ข้อความ Error (ถ้ามี)
  success?: boolean; // สถานะถูกต้อง (Success)
  children: React.ReactNode; // Input Element (เช่น <input>, <select>)
  htmlFor?: string; // ID ของ Input (สำหรับ Accessibility)
}

/**
 * FormField Component
 * Wrapper component สำหรับฟอร์ม
 * - แสดง Label, Error Message, Success Message
 * - จัด Layout Standard สำหรับทุก Input
 */
const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  success,
  children,
  htmlFor,
}) => {
  const { locale } = useNavigation();

  return (
    <div className="flex flex-col gap-2">
      {/* Label พร้อมเครื่องหมายดอกจัน (*) ถ้า required */}
      <label
        htmlFor={htmlFor}
        className="text-base font-medium text-foreground flex items-center gap-1"
      >
        {label}
        {required && <span className="text-error">*</span>}
      </label>

      {/* Input Element */}
      {children}

      {/* แสดง Error Message */}
      {error && (
        <p className="text-sm text-error flex items-start gap-1.5">
          <span className="mt-0.5">⚠</span>
          <span>{error}</span>
        </p>
      )}

      {/* แสดง Success Message (ถ้าไม่มี Error และสถานะ Success เป็น true) */}
      {success && !error && (
        <p className="text-sm text-success flex items-center gap-1.5">
          <span>✓</span>
          <span>{locale === 'th' ? 'ถูกต้อง' : 'Valid'}</span>
        </p>
      )}
    </div>
  );
};

export default FormField;
