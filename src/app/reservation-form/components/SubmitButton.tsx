import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface SubmitButtonProps {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ disabled, loading, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        w-full flex items-center justify-center gap-2 px-8 py-4 rounded-md
        text-base font-medium transition-smooth min-h-[44px]
        ${
          disabled || loading
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground shadow-warm-sm hover:shadow-warm-md hover:-translate-y-0.5 active:scale-[0.97]'
        }
      `}
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          <span>กำลังส่ง...</span>
        </>
      ) : (
        <>
          <Icon name="CheckCircleIcon" size={20} />
          <span>ยืนยันการจอง</span>
        </>
      )}
    </button>
  );
};

export default SubmitButton;
