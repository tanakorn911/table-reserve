import Icon from '@/components/ui/AppIcon';
import { useNavigation } from '@/contexts/NavigationContext';
import { useTranslation } from '@/lib/i18n';

interface GuestNumberInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  error?: boolean;
  success?: boolean;
}

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

  const handleIncrement = () => {
    const currentValue = parseInt(value) || 0;
    if (currentValue < max) {
      const syntheticEvent = {
        target: { name, value: String(currentValue + 1) },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  const handleDecrement = () => {
    const currentValue = parseInt(value) || 0;
    if (currentValue > min) {
      const syntheticEvent = {
        target: { name, value: String(currentValue - 1) },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <div className="relative flex items-center group">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={!value || parseInt(value) <= min}
        className="
          flex items-center justify-center w-14 h-14 rounded-l-2xl
          bg-white/5 border border-white/10 border-r-0
          text-white transition-all duration-300
          hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]
          disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none
        "
      >
        <Icon name="MinusIcon" size={20} />
      </button>
      <div className="relative flex-1 h-14">
        <input
          id={id}
          name={name}
          type="number"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          min={min}
          max={max}
          placeholder="0"
          className={`
            w-full h-full text-center text-xl font-bold
            bg-white/5 border-y border-white/10 text-white
            focus:outline-none focus:bg-white/10 transition-all duration-300
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            ${error ? 'border-error/50 bg-error/10' : success ? 'border-success/50 bg-success/10' : ''}
          `}
        />
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 text-xs font-medium text-gray-400">
          {t('form.guests.label')}
        </div>
      </div>
      <button
        type="button"
        onClick={handleIncrement}
        disabled={parseInt(value) >= max}
        className="
          flex items-center justify-center w-14 h-14 rounded-r-2xl
          bg-white/5 border border-white/10 border-l-0
          text-white transition-all duration-300
          hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]
          disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none
        "
      >
        <Icon name="PlusIcon" size={20} />
      </button>
    </div>
  );
};

export default GuestNumberInput;
