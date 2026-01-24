'use client';

import React from 'react';

export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-blue-900 font-bold animate-pulse">กำลังโหลดข้อมูลระบบ...</p>
      </div>
    </div>
  );
}
