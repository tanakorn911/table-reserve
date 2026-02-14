'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { TrashIcon, PhotoIcon, LinkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

type Ad = {
  id: string;
  title: string;
  image_url: string;
  link?: string | null;
  active?: boolean;
  created_at?: string;
};

export default function AdminAdvertisements() {
  // แก้ไขตรงนี้: ใช้ resolvedAdminTheme เพื่อรองรับโหมด System
  const { adminTheme, resolvedAdminTheme } = useAdminTheme();
  
  // ใช้ค่า resolved ก่อน ถ้าไม่มีให้ใช้ adminTheme (fallback)
  const currentTheme = resolvedAdminTheme || adminTheme;
  const isDark = currentTheme === 'dark';

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
      const ext = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const filePath = `ads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('advertisements')
        .upload(filePath, selectedFile);

      if (uploadError) throw new Error('อัปโหลดรูปล้มเหลว: ' + uploadError.message);

      const { data: { publicUrl } } = supabase.storage.from('advertisements').getPublicUrl(filePath);

      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), image_url: publicUrl, link: link.trim() }),
      });

      if (!res.ok) throw new Error('บันทึกข้อมูลโฆษณาล้มเหลว');

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
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        
        <header className="flex justify-between items-center">
          <h2 className={`text-2xl font-bold transition-colors ${isDark ? 'text-white' : 'text-gray-800'}`}>
            จัดการโฆษณา (Banner)
          </h2>
        </header>

        <section className={`p-6 rounded-2xl shadow-sm border transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 transition-colors ${
            isDark ? 'text-gray-100' : 'text-gray-900'
          }`}>
            <PlusIcon className="w-5 h-5 text-blue-500" /> เพิ่มโฆษณาใหม่
          </h3>
          <form onSubmit={createAd} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  หัวข้อโฆษณา
                </label>
                <input 
                  type="text"
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className={`w-full rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    isDark 
                      ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  placeholder="เช่น โปรโมชั่นฉลองเปิดร้าน"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 flex items-center gap-1 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <LinkIcon className="w-4 h-4" /> ลิงก์ปลายทาง (ถ้ามี)
                </label>
                <input 
                  type="url"
                  value={link} 
                  onChange={(e) => setLink(e.target.value)} 
                  className={`w-full rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    isDark 
                      ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
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

            <div className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-4 transition-colors hover:border-blue-400 ${
              isDark ? 'border-gray-600 bg-gray-900/50' : 'border-gray-300 bg-gray-50/50'
            }`}>
              {imagePreview ? (
                <div className="relative w-full h-full min-h-[150px]">
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover rounded-xl" />
                  <button 
                    type="button"
                    onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-md transition-transform hover:scale-105 active:scale-95"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center">
                  <PhotoIcon className={`w-12 h-12 mb-2 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <span className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>คลิกเพื่ออัปโหลดรูปภาพ</span>
                  <span className={`text-xs mt-1 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>(สัดส่วนแนะนำ 16:9)</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <h3 className={`text-lg font-semibold flex items-center gap-2 transition-colors ${isDark ? 'text-white' : 'text-gray-800'}`}>
            รายการโฆษณาปัจจุบัน 
            {ads.length > 0 && (
              <span className={`text-xs px-2 py-1 rounded-full transition-colors ${
                isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'
              }`}>
                {ads.length}
              </span>
            )}
          </h3>

          {error && (
            <div className={`p-4 border-l-4 rounded-r-lg text-sm transition-colors ${
              isDark ? 'bg-red-900/20 border-red-500 text-red-300' : 'bg-red-50 border-red-500 text-red-700'
            }`}>
              <p className="font-bold">เกิดข้อผิดพลาด</p>
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className={`text-center py-10 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              กำลังโหลดรายการ...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ads.map((ad) => (
                <div key={ad.id} className={`flex gap-4 p-3 rounded-xl border shadow-sm hover:shadow-md transition-all group ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}>
                  <div className="w-32 h-20 flex-shrink-0 overflow-hidden rounded-lg">
                    <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className={`font-bold truncate transition-colors ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {ad.title}
                    </h4>
                    {ad.link && (
                      <p className="text-xs text-blue-500 truncate mt-1 underline italic">{ad.link}</p>
                    )}
                    <p className={`text-[10px] mt-1 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      เพิ่มเมื่อ: {new Date(ad.created_at || '').toLocaleDateString('th-TH')}
                    </p>
                  </div>
                  <div className="flex items-center pr-2">
                    <button 
                      onClick={() => deleteAd(ad.id)}
                      className={`p-2 rounded-lg transition-colors active:scale-95 ${
                        isDark 
                          ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/30' 
                          : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                      }`}
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
            <div className={`text-center py-12 border-2 border-dashed rounded-2xl transition-colors ${
              isDark ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'
            }`}>
              ยังไม่มีโฆษณาในระบบ
            </div>
          )}
        </section>
      </div>
    </div>
  );
}