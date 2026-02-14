"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { TrashIcon, PhotoIcon, LinkIcon, PlusIcon } from '@heroicons/react/24/outline';

type Ad = {
  id: string;
  title: string;
  image_url: string;
  link?: string | null;
  active?: boolean;
  created_at?: string;
};

export default function AdminAdvertisements() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientSupabaseClient();

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ads');
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        setAds([]);
      } else {
        setAds(json.data || []);
        setError(null);
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ตรวจสอบขนาดไฟล์ (เช่น ไม่เกิน 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('ขนาดรูปภาพต้องไม่เกิน 2MB');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const createAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) return setError('กรุณากรอกหัวข้อโฆษณา');
    if (!selectedFile) return setError('กรุณาเลือกรูปภาพ');

    setUploading(true);
    try {
      // 1. Upload Image
      const ext = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const filePath = `ads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('advertisements')
        .upload(filePath, selectedFile);

      if (uploadError) throw new Error('อัปโหลดรูปล้มเหลว: ' + uploadError.message);

      // 2. Get URL
      const { data: { publicUrl } } = supabase.storage.from('advertisements').getPublicUrl(filePath);

      // 3. Save to DB
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), image_url: publicUrl, link: link.trim() }),
      });

      if (!res.ok) throw new Error('บันทึกข้อมูลโฆษณาล้มเหลว');

      // Reset Form
      setTitle('');
      setLink('');
      setSelectedFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      fetchAds();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteAd = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโฆษณาชิ้นนี้?')) return;
    try {
      const res = await fetch('/api/ads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchAds();
      else setError('ไม่สามารถลบโฆษณาได้');
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการลบ');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">จัดการโฆษณา (Banner)</h2>
      </header>

      {/* Form Section */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <PlusIcon className="w-5 h-5 text-blue-500" /> เพิ่มโฆษณาใหม่
        </h3>
        <form onSubmit={createAd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">หัวข้อโฆษณา</label>
              <input 
                type="text"
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น โปรโมชั่นฉลองเปิดร้าน"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <LinkIcon className="w-4 h-4" /> ลิงก์ปลายทาง (ถ้ามี)
              </label>
              <input 
                type="url"
                value={link} 
                onChange={(e) => setLink(e.target.value)} 
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>
            <button 
              type="submit" 
              disabled={uploading} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              {uploading ? 'กำลังประมวลผล...' : 'ยืนยันการเพิ่มโฆษณา'}
            </button>
          </div>

          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-4 transition-colors hover:border-blue-400">
            {imagePreview ? (
              <div className="relative w-full h-full min-h-[150px]">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover rounded-xl" />
                <button 
                  type="button"
                  onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-md"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center">
                <PhotoIcon className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">คลิกเพื่ออัปโหลดรูปภาพ</span>
                <span className="text-xs text-gray-400 mt-1">(สัดส่วนแนะนำ 16:9)</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>
        </form>
      </section>

      {/* Display Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          รายการโฆษณาปัจจุบัน {ads.length > 0 && <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">{ads.length}</span>}
        </h3>

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm">
            <p className="font-bold">เกิดข้อผิดพลาด</p>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-10 text-gray-500">กำลังโหลดรายการ...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ads.map((ad) => (
              <div key={ad.id} className="flex gap-4 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-32 h-20 flex-shrink-0 overflow-hidden rounded-lg">
                  <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="font-bold text-gray-800 dark:text-white truncate">{ad.title}</h4>
                  {ad.link && (
                    <p className="text-xs text-blue-500 truncate mt-1 underline italic">{ad.link}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">เพิ่มเมื่อ: {new Date(ad.created_at || '').toLocaleDateString('th-TH')}</p>
                </div>
                <div className="flex items-center pr-2">
                  <button 
                    onClick={() => deleteAd(ad.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="ลบ"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && ads.length === 0 && !error && (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400">
            ยังไม่มีโฆษณาในระบบ
          </div>
        )}
      </section>
    </div>
  );
}