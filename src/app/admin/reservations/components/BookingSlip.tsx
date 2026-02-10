import React from 'react';

interface BookingSlipProps {
  reservation: any;
  ref: any;
}

export const BookingSlip = React.forwardRef<HTMLDivElement, BookingSlipProps>(
  ({ reservation }, ref) => {
    if (!reservation) return null;

    // Format Date/Time helper
    const formatDate = (dateString: string) => {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    return (
      <div ref={ref} className="p-4 bg-white text-black w-[80mm] mx-auto hidden print:block font-mono">
        {/* Header */}
        <div className="text-center border-b-2 border-dashed border-black pb-4 mb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">Savory Bistro</h1>
          <p className="text-xs text-gray-600">123 Delicious Street, Food City</p>
          <p className="text-xs text-gray-600">Tel: 02-123-4567</p>
          <div className="mt-4 border-t border-black pt-2">
            <h2 className="text-lg font-bold">RESERVATION SLIP</h2>
            <p className="text-xs text-gray-500">ใบบันทึกการจอง</p>
          </div>
        </div>

        {/* Booking Details */}
        <div className="space-y-3 text-sm mb-4 border-b-2 border-dashed border-black pb-4">
          <div className="flex justify-between items-baseline">
            <span className="font-bold text-gray-800">Booking Ref:</span>
            <span className="font-bold text-lg">
              {reservation.booking_code || reservation.id?.slice(0, 8).toUpperCase() || '-'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-xs text-gray-500">Date/วันที่</p>
              <p className="font-bold">{formatDate(reservation.reservation_date)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Time/เวลา</p>
              <p className="font-bold text-lg">{reservation.reservation_time?.slice(0, 5)}</p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
            <span className="font-bold">Table / โต๊ะ:</span>
            <span className="font-bold text-xl">{reservation.table_number ? `T-${reservation.table_number}` : '-'}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Guests / จำนวน:</span>
            <span className="font-bold">{reservation.party_size} ท่าน</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Status / สถานะ:</span>
            <span className="font-bold uppercase">{reservation.status}</span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-4 border-b-2 border-dashed border-black pb-4">
          <p className="font-bold text-xs text-gray-500 mb-1">CUSTOMER INFO / ข้อมูลลูกค้า</p>
          <p className="text-lg font-bold mb-1">{reservation.guest_name}</p>
          <p className="text-sm">{reservation.guest_phone}</p>
        </div>

        {/* Special Request */}
        {reservation.special_requests && (
          <div className="mb-4 border-b-2 border-dashed border-black pb-4">
            <p className="font-bold text-xs text-gray-500 mb-1">NOTE / หมายเหตุ</p>
            <p className="text-sm italic">"{reservation.special_requests}"</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] text-gray-500 mt-4 space-y-1">
          <p>Please present this slip to the reception.</p>
          <p>กรุณาแสดงใบนี้ต่อพนักงานต้อนรับ</p>
          <p className="mt-4 font-bold">Thank you / ขอบคุณครับ</p>
          <p className="pt-2">{new Date().toLocaleString('th-TH')}</p>
        </div>
      </div>
    );
  }
);

BookingSlip.displayName = 'BookingSlip';
