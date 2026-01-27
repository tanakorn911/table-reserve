'use client';

import { useState } from 'react';

interface PasswordChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    locale: string;
}

export default function PasswordChangeModal({ isOpen, onClose, locale }: PasswordChangeModalProps) {
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordChanging, setPasswordChanging] = useState(false);

    const handleChangePassword = async () => {
        // Validation
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            alert(locale === 'th' ? 'กรุณากรอกข้อมูลให้ครบทุกช่อง' : 'Please fill in all fields');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert(locale === 'th' ? 'รหัสผ่านใหม่ไม่ตรงกัน' : 'New passwords do not match');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            alert(locale === 'th' ? 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' : 'New password must be at least 6 characters');
            return;
        }

        setPasswordChanging(true);
        try {
            const response = await fetch('/api/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to change password');
            }

            alert(locale === 'th' ? '✅ เปลี่ยนรหัสผ่านสำเร็จ!' : '✅ Password changed successfully!');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            onClose();
        } catch (error: any) {
            alert((locale === 'th' ? '❌ เกิดข้อผิดพลาด: ' : '❌ Error: ') + error.message);
        } finally {
            setPasswordChanging(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={() => {
                        onClose();
                        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                        {locale === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}
                    </h3>
                    <p className="text-base text-gray-600 mt-2 font-medium">
                        {locale === 'th' ? 'กรุณากรอกข้อมูลด้านล่างเพื่อเปลี่ยนรหัสผ่าน' : 'Please fill in the form below to change your password'}
                    </p>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                            {locale === 'th' ? 'รหัสผ่านปัจจุบัน' : 'Current Password'}
                        </label>
                        <input
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 font-bold text-gray-900 placeholder-gray-400 transition-all text-lg"
                            placeholder="••••••••"
                            style={{ fontSize: '1.125rem' }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                            {locale === 'th' ? 'รหัสผ่านใหม่' : 'New Password'}
                        </label>
                        <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 font-bold text-gray-900 placeholder-gray-400 transition-all text-lg"
                            placeholder="••••••••"
                            style={{ fontSize: '1.125rem' }}
                        />
                        <p className="text-sm text-gray-500 mt-1.5 ml-1 font-medium">
                            {locale === 'th' ? 'อย่างน้อย 6 ตัวอักษร' : 'At least 6 characters'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                            {locale === 'th' ? 'ยืนยันรหัสผ่านใหม่' : 'Confirm New Password'}
                        </label>
                        <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 font-bold text-gray-900 placeholder-gray-400 transition-all text-lg"
                            placeholder="••••••••"
                            style={{ fontSize: '1.125rem' }}
                        />
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button
                        onClick={() => {
                            onClose();
                            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors text-base"
                    >
                        {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
                    </button>
                    <button
                        onClick={handleChangePassword}
                        disabled={passwordChanging}
                        className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
                    >
                        {passwordChanging ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                {locale === 'th' ? 'กำลังเปลี่ยน...' : 'Changing...'}
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                {locale === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
