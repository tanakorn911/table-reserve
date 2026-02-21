'use client';

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAdminLocale } from '@/app/admin/components/LanguageSwitcher';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

interface PasswordChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// PasswordChangeModal Component
// คอมโพเนนต์ Modal สำหรับเปลี่ยนรหัสผ่านของผู้ดูแลระบบ
export default function PasswordChangeModal({ isOpen, onClose }: PasswordChangeModalProps) {
    const { resolvedAdminTheme } = useAdminTheme();
    const locale = useAdminLocale();
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    // ฟังก์ชันจัดการการเปลี่ยนรหัสผ่าน
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        // ตรวจสอบความถูกต้องของข้อมูล
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

        setLoading(true);

        try {
            // เรียก API เพื่อเปลี่ยนรหัสผ่าน (API จะตรวจสอบรหัสผ่านปัจจุบันให้ฝั่ง Server)
            const res = await fetch('/api/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                // แสดง error ภาษาไทยถ้ารหัสผ่านปัจจุบันไม่ถูกต้อง
                if (res.status === 401 && data.error === 'Current password is incorrect') {
                    throw new Error(locale === 'th' ? 'รหัสผ่านปัจจุบันไม่ถูกต้อง' : 'Current password is incorrect');
                }
                throw new Error(data.error || (locale === 'th' ? 'เกิดข้อผิดพลาด' : 'An error occurred'));
            }

            alert(locale === 'th' ? 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' : 'Password changed successfully');
            onClose();
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });

        } catch (error: any) {
            console.error('Error changing password:', error);
            alert(error.message || (locale === 'th' ? 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' : 'Failed to change password'));
        } finally {
            setLoading(false);
        }
    };

    // Helper for Theme Styles
    // ตัวช่วยกำหนดสีและสไตล์ตาม Theme
    const themeClasses = resolvedAdminTheme === 'dark' ? {
        modal: 'bg-gray-800 border-gray-700',
        text: 'text-white',
        input: 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500',
        label: 'text-gray-300',
        closeBtn: 'text-gray-400 hover:text-white hover:bg-gray-700',
        cancelBtn: 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600',
        saveBtn: 'bg-blue-600 hover:bg-blue-700',
    } : {
        modal: 'bg-white border-gray-200',
        text: 'text-gray-900',
        input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500',
        label: 'text-gray-700',
        closeBtn: 'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
        cancelBtn: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
        saveBtn: 'bg-blue-600 hover:bg-blue-700',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className={`rounded-xl w-full max-w-md p-8 shadow-2xl border ${themeClasses.modal}`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-xl font-bold ${themeClasses.text}`}>
                        {locale === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}
                    </h2>
                    <button
                        onClick={onClose}
                        className={`p-1 rounded-full transition-colors ${themeClasses.closeBtn}`}
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${themeClasses.label}`}>
                            {locale === 'th' ? 'รหัสผ่านปัจจุบัน' : 'Current Password'}
                        </label>
                        <input
                            type="password"
                            required
                            className={`block w-full px-4 py-2 rounded-lg border focus:ring-2 focus:border-transparent transition-all ${themeClasses.input}`}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-1 ${themeClasses.label}`}>
                            {locale === 'th' ? 'รหัสผ่านใหม่' : 'New Password'}
                        </label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className={`block w-full px-4 py-2 rounded-lg border focus:ring-2 focus:border-transparent transition-all ${themeClasses.input}`}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-1 ${themeClasses.label}`}>
                            {locale === 'th' ? 'ยืนยันรหัสผ่านใหม่' : 'Confirm New Password'}
                        </label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className={`block w-full px-4 py-2 rounded-lg border focus:ring-2 focus:border-transparent transition-all ${themeClasses.input}`}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-4 py-2 rounded-lg font-medium border transition-colors ${themeClasses.cancelBtn}`}
                        >
                            {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 text-white rounded-lg font-bold shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-wait ${themeClasses.saveBtn}`}
                        >
                            {loading
                                ? (locale === 'th' ? 'กำลังบันทึก...' : 'Saving...')
                                : (locale === 'th' ? 'บันทึก' : 'Save Password')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
