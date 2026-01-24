
import React from 'react';

interface BookingSlipProps {
    reservation: any;
    ref: any;
}

export const BookingSlip = React.forwardRef<HTMLDivElement, BookingSlipProps>(({ reservation }, ref) => {
    if (!reservation) return null;

    return (
        <div ref={ref} className="p-8 bg-white text-black w-[80mm] mx-auto hidden print:block">
            <div className="text-center border-b-2 border-dashed border-gray-400 pb-4 mb-4">
                <h1 className="text-xl font-bold">BOOKING X</h1>
                <p className="text-sm">ใบยืนยันการจอง / Booking Slip</p>
            </div>

            <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                    <span className="font-bold">รหัสจอง:</span>
                    <span className="font-mono font-bold text-lg">{reservation.booking_code || `#${reservation.id.slice(0, 8)}`}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-bold">วันที่:</span>
                    <span>{reservation.reservation_date}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-bold">เวลา:</span>
                    <span>{reservation.reservation_time}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-bold">โต๊ะ:</span>
                    <span>{reservation.table_number ? `T-${reservation.table_number}` : '-'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-bold">จำนวน:</span>
                    <span>{reservation.party_size} ท่าน</span>
                </div>
            </div>

            <div className="border-t border-b border-gray-200 py-2 mb-4">
                <p className="font-bold">ชื่อลูกค้า:</p>
                <p className="text-lg">{reservation.guest_name}</p>
                <p className="text-sm text-gray-600">{reservation.guest_phone}</p>
            </div>

            {reservation.special_requests && (
                <div className="mb-4">
                    <p className="font-bold text-xs">Note:</p>
                    <p className="text-sm">{reservation.special_requests}</p>
                </div>
            )}

            <div className="text-center text-xs text-gray-500 mt-6 pt-2 border-t border-dashed border-gray-400">
                <p>กรุณาแสดงใบนี้ต่อพนักงาน</p>
                <p>ขอบคุณที่ใช้บริการครับ</p>
                <p className="mt-2">{new Date().toLocaleString('th-TH')}</p>
            </div>
        </div>
    );
});

BookingSlip.displayName = 'BookingSlip';
