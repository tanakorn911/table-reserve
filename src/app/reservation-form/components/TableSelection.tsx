'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

// Note: TABLE_TYPES import removed as we now accept tables as props
import { Table } from '@/types/tables';

interface TableSelectionProps {
  tables: Table[];
  selectedTableId: number | undefined;
  onSelect: (id: number) => void;
  bookedTableIds: number[];
  partySize: number;
  error?: boolean;
}

const TableSelection: React.FC<TableSelectionProps> = ({
  tables,
  selectedTableId,
  onSelect,
  bookedTableIds = [],
  partySize,
  error = false,
}) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tables.map((table) => {
          const isBooked = bookedTableIds.includes(table.id);
          const isCapacityLow = table.capacity < partySize;
          const isDisabled = isBooked || isCapacityLow;
          const isSelected = selectedTableId === table.id;

          return (
            <button
              key={table.id}
              type="button"
              onClick={() => !isDisabled && onSelect(table.id)}
              disabled={isDisabled}
              className={`
                relative flex items-start p-4 rounded-xl border-2 text-left transition-all duration-200
                ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : isBooked
                      ? 'border-red-200/50 bg-red-50/10 cursor-not-allowed pointer-events-none' // Booked: No opacity opacity, just specific colors
                      : isDisabled
                        ? 'border-muted bg-gray-100/50 opacity-40 cursor-not-allowed grayscale pointer-events-none'
                        : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
                }
                ${error && !isSelected ? 'border-error/50' : ''}
              `}
            >
              <div
                className={`
                p-2 rounded-lg mr-3 shrink-0
                ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
              `}
              >
                <Icon name="QueueListIcon" size={24} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-semibold ${isSelected ? 'text-primary' : isBooked ? 'text-red-500/90' : 'text-foreground'}`}
                  >
                    {table.name}
                  </span>
                  {isBooked ? (
                    <span className="text-xs font-medium text-red-600 px-2 py-0.5 rounded-full bg-red-100/80">
                      ไม่ว่าง
                    </span>
                  ) : isCapacityLow ? (
                    <span className="text-xs font-medium text-warning px-2 py-0.5 rounded-full bg-warning/10">
                      ที่นั่งไม่พอ
                    </span>
                  ) : isSelected ? (
                    <span className="text-xs font-medium text-primary px-2 py-0.5 rounded-full bg-primary/10">
                      เลือกแล้ว
                    </span>
                  ) : null}
                </div>
                <p
                  className={`text-sm line-clamp-2 ${isBooked ? 'text-red-400/80' : 'text-muted-foreground'}`}
                >
                  {table.description}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon name="UsersIcon" size={14} />
                  <span>รองรับ {table.capacity} ท่าน</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TableSelection;
