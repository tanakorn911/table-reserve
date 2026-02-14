'use client';

import Icon from '@/components/ui/AppIcon';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';

interface GuestNumberInputProps {
  id: string;
  name: string;
  value: string; // ค่าจำนวนแขก (เป็น string เพื่อให้รองรับ Empty state ใน input)
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  min?: number; // จำนวนขั้นต่ำ
  max?: number; // จำนวนสูงสุด
  error?: boolean; // สถานะ Error
  success?: boolean; // สถานะ Success
}

/**
 * GuestNumberInput Component
 * Input สำหรับเลือกจำนวนแขก แบบมีปุ่ม +/-
 * - แสดงเป็นตัวเลขตรงกลาง
 * - ปุ่มลบ (-) ด้านซ้าย
 * - ปุ่มบวก (+) ด้านขวา
 */
const GuestNumberInput: React.FC<GuestNumberInputProps> = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  min = 1,
  max = 50,
  error = false,
  success = false,
}) => {
  const { locale } = useNavigation();
  const { t } = useTranslation(locale);

  // เพิ่มจำนวนแขก
  const handleIncrement = () => {
    const currentValue = parseInt(value) || 0;
    if (currentValue < max) {
      const syntheticEvent = {
        target: { name, value: String(currentValue + 1) },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  // ลดจำนวนแขก
  const handleDecrement = () => {
    const currentValue = parseInt(value) || 0;
    if (currentValue > min) {
      const syntheticEvent = {
        target: { name, value: String(currentValue - 1) },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  // จัดการเมื่อมีการพิมพ์เลขเอง
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(e);
      return;
    }

    const numVal = parseInt(val);
    if (!isNaN(numVal)) {
      if (numVal > max) {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, name, value: String(max) },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      } else {
        onChange(e);
      }
    }
  };

  return (
    <div className="relative flex items-center group">
      {/* ปุ่มลดจำนวน */}
      <button
        type="button"
        onClick={handleDecrement}
        disabled={!value || parseInt(value) <= min}
        className="
          flex items-center justify-center w-14 h-14 rounded-l-2xl
          bg-muted border border-border border-r-0
          text-foreground transition-all duration-300
          hover:bg-muted/80 hover:shadow-md
          disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none
        "
      >
        <Icon name="MinusIcon" size={20} />
      </button>

      {/* ช่องกรอกตัวเลข */}
      <div className="relative flex-1 h-14">
        <input
          id={id}
          name={name}
          type="number"
          value={value}
          onChange={handleInputChange}
          onBlur={onBlur}
          min={min}
          max={max}
          placeholder="0"
          className={`
            w-full h-full text-center text-xl font-bold
            bg-muted border-y border-border text-foreground
            focus:outline-none focus:bg-muted/80 transition-all duration-300
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            ${error ? 'border-error/50 bg-error/10' : success ? 'border-success/50 bg-success/10' : ''}
          `}
        />
        {/* Label ลอยที่ด้านล่าง */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 text-xs font-medium text-muted-foreground">
          {t('form.guests.label')}
        </div>
      </div>

      {/* ปุ่มเพิ่มจำนวน */}
      <button
        type="button"
        onClick={handleIncrement}
        disabled={parseInt(value) >= max}
        className="
          flex items-center justify-center w-14 h-14 rounded-r-2xl
          bg-muted border border-border border-l-0
          text-foreground transition-all duration-300
          hover:bg-muted/80 hover:shadow-md
          disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none
        "
      >
        <Icon name="PlusIcon" size={20} />
      </button>
    </div>
  );
};

export default GuestNumberInput;
