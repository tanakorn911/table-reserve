import React from 'react';
import Icon from '@/components/ui/AppIcon';

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
        <div className="relative flex items-center">
            <button
                type="button"
                onClick={handleDecrement}
                disabled={!value || parseInt(value) <= min}
                className="
          flex items-center justify-center w-12 h-12 rounded-l-lg
          bg-muted border-2 border-r-0 border-border
          text-foreground transition-smooth
          hover:bg-primary/20 hover:text-primary
          disabled:opacity-50 disabled:cursor-not-allowed
        "
            >
                <Icon name="MinusIcon" size={20} />
            </button>
            <div className="relative flex-1">
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
            w-full text-center py-3 text-lg font-bold
            bg-input border-y-2 transition-smooth
            focus:outline-none focus:ring-0
            min-h-[48px]
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            ${error ? 'border-error' : success ? 'border-success' : 'border-border'}
          `}
                />
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 text-xs text-muted-foreground">
                    คน
                </div>
            </div>
            <button
                type="button"
                onClick={handleIncrement}
                disabled={parseInt(value) >= max}
                className="
          flex items-center justify-center w-12 h-12 rounded-r-lg
          bg-muted border-2 border-l-0 border-border
          text-foreground transition-smooth
          hover:bg-primary/20 hover:text-primary
          disabled:opacity-50 disabled:cursor-not-allowed
        "
            >
                <Icon name="PlusIcon" size={20} />
            </button>
        </div>
    );
};

export default GuestNumberInput;
