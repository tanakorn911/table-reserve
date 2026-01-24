import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface ReservationDetails {
    id: string;
    bookingCode?: string;
    fullName: string;
    phone: string;
    guests: string;
    date: string;
    time: string;
    specialRequests: string;
}

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    reservationDetails: ReservationDetails;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, reservationDetails }) => {
    if (!isOpen) return null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString + 'T00:00:00');
        // Add Thailand timezone offset (UTC+7)
        const thailandOffset = 7 * 60;
        const localOffset = date.getTimezoneOffset();
        const thailandDate = new Date(date.getTime() + (thailandOffset + localOffset) * 60000);
        return thailandDate.toLocaleDateString('th-TH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        return `${hour}:${minutes} น.`;
    };

    return (
        <>
            <div
                className="fixed inset-0 z-300 bg-foreground/60 backdrop-blur-sm transition-smooth"
                onClick={onClose}
                aria-hidden="true"
            />
            <div className="fixed inset-0 z-300 flex items-center justify-center p-4">
                <div
                    className="
            w-full max-w-md bg-card rounded-lg shadow-warm-xl
            animate-in zoom-in-95 duration-250
          "
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="success-title"
                >
                    <div className="p-6 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                            <Icon name="CheckCircleIcon" size={40} className="text-success" variant="solid" />
                        </div>
                        <h2
                            id="success-title"
                            className="text-2xl font-heading font-bold text-foreground text-center"
                        >
                            ยืนยันการจองแล้ว!
                        </h2>
                        <p className="text-base text-muted-foreground text-center">
                            โต๊ะของคุณได้รับการจองเรียบร้อยแล้ว <br></br>เราตั้งตารอที่จะให้บริการคุณ!
                        </p>
                        <p className="text-base text-muted-foreground text-center">
                            **กรุณาแคปหน้าจอเพื่อใช้เป็นหลักฐานการจอง**
                        </p>
                    </div>

                    <div className="px-6 pb-6">
                        <div className="bg-muted rounded-md p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <Icon name="IdentificationIcon" size={20} className="text-primary mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">รหัสการจอง</p>
                                    <p className="text-xl font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border-2 border-blue-200 inline-block tracking-widest">
                                        {reservationDetails.bookingCode || reservationDetails.id.slice(0, 8)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Icon name="UserIcon" size={20} className="text-primary mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">ชื่อ</p>
                                    <p className="text-base font-medium text-foreground">
                                        {reservationDetails.fullName}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Icon name="PhoneIcon" size={20} className="text-primary mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">เบอร์โทรศัพท์</p>
                                    <p className="text-base font-medium text-foreground">
                                        {reservationDetails.phone}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Icon name="CalendarIcon" size={20} className="text-primary mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">วันที่</p>
                                    <p className="text-base font-medium text-foreground">
                                        {formatDate(reservationDetails.date)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Icon name="ClockIcon" size={20} className="text-primary mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">เวลา</p>
                                    <p className="text-base font-medium text-foreground">
                                        {formatTime(reservationDetails.time)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Icon name="UsersIcon" size={20} className="text-primary mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">จำนวนแขก</p>
                                    <p className="text-base font-medium text-foreground">
                                        {reservationDetails.guests} ท่าน
                                    </p>
                                </div>
                            </div>
                            {reservationDetails.specialRequests && (
                                <div className="flex items-start gap-3">
                                    <Icon name="ChatBubbleLeftRightIcon" size={20} className="text-primary mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">คำขอพิเศษ</p>
                                        <p className="text-base font-medium text-foreground">
                                            {reservationDetails.specialRequests}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-6 pb-6 flex gap-3">
                        <button
                            onClick={onClose}
                            className="
                flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-md
                text-base font-medium bg-primary text-primary-foreground
                shadow-warm-sm transition-smooth hover:shadow-warm-md
                hover:-translate-y-0.5 active:scale-[0.97] min-h-[44px]
              "
                        >
                            <Icon name="HomeIcon" size={20} />
                            <span>กลับสู่หน้าหลัก</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SuccessModal;
