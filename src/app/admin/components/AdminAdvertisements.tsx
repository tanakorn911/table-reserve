"use client";

import React, { useEffect, useState } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase/client';

type Ad = {
  id: string | number;
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

  const supabase = createClientSupabaseClient();

  const fetchAds = async () => {
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
      console.error(err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const createAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title || title.trim().length === 0) {
      setError('กรุณากรอกหัวข้อ');
      return;
    }

    // Need either a selected file to upload
    if (!selectedFile) {
      setError('กรุณาเลือกไฟล์รูปภาพสำหรับโฆษณา');
      return;
    }

    setUploading(true);
    try {
      // upload file to Supabase Storage in bucket `advertisements`
      const ext = selectedFile.name.split('.').pop();
      const filePath = `advertisements/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('advertisements')
        .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        console.error('Upload error', uploadError);
        setError(uploadError.message || 'ไม่สามารถอัปโหลดรูปได้');
        setUploading(false);
        return;
      }

      // get public url
      const { data: publicData } = await supabase.storage.from('advertisements').getPublicUrl(filePath);
      const publicUrl = (publicData as any)?.publicUrl;
      if (!publicUrl) {
        setError('ไม่สามารถสร้าง URL สาธารณะสำหรับรูปได้');
        setUploading(false);
        return;
      }

      // create ad record via API
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), image_url: publicUrl, link }),
      });
      const json = await res.json();
      if (res.ok) {
        setTitle('');
        setSelectedFile(null);
        setImagePreview(null);
        setLink('');
        fetchAds();
      } else {
        setError(json.error || 'ไม่สามารถเพิ่มโฆษณาได้');
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setUploading(false);
    }
  };

  const deleteAd = async (id: string | number) => {
    if (!confirm('ลบโฆษณาชิ้นนี้?')) return;
    try {
      const res = await fetch('/api/ads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (res.ok) {
        fetchAds();
      } else {
        setError(json.error || 'ไม่สามารถลบโฆษณาได้');
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const [error, setError] = useState<string | null>(null);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">จัดการโฆษณา</h2>

      <form onSubmit={createAd} className="mb-6 space-y-2 max-w-md">
        <div>
          <label className="block text-sm">หัวข้อ</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm">รูปภาพ (อัปโหลด)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setSelectedFile(f);
              if (f) {
                const url = URL.createObjectURL(f);
                setImagePreview(url);
              } else {
                setImagePreview(null);
              }
            }}
            className="w-full"
          />
          {imagePreview && (
            <div className="mt-2">
              <img src={imagePreview} alt="preview" className="w-48 h-28 object-cover rounded" />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm">ลิงก์ (ไม่บังคับ)</label>
          <input value={link} onChange={(e) => setLink(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div>
          <button type="submit" disabled={uploading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
            {uploading ? 'กำลังอัปโหลด...' : 'เพิ่มโฆษณา'}
          </button>
        </div>
      </form>

      <div>
        <h3 className="text-lg font-medium mb-2">รายการโฆษณา</h3>
        {error && (
          <div className="mb-4 p-3 bg-red-800/60 text-red-100 rounded">
            <div className="font-bold">เกิดข้อผิดพลาด:</div>
            <div className="text-sm mt-1">{error}</div>
            {error.includes('Could not find the table') && (
              <div className="mt-3 text-sm bg-yellow-900/40 p-3 rounded">
                ตาราง `public.advertisements` ยังไม่มีในฐานข้อมูล.
                คุณสามารถสร้างได้ด้วย SQL ต่อไปนี้ (รันที่ฐานข้อมูลของคุณ):
                <pre className="mt-2 p-2 bg-black/20 rounded overflow-auto text-xs">
CREATE TABLE public.advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  link text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
                </pre>
              </div>
            )}
          </div>
        )}

        {loading && <div>กำลังโหลด...</div>}
        {!loading && ads.length === 0 && !error && <div>ยังไม่มีโฆษณา</div>}
        <ul className="space-y-4">
          {ads.map((ad) => (
            <li key={String(ad.id)} className="flex items-center gap-4 border p-3 rounded bg-gray-900/20">
              <img src={ad.image_url} alt={ad.title} className="w-32 h-20 object-cover rounded" />
              <div className="flex-1">
                <div className="font-semibold">{ad.title}</div>
                {ad.link && (
                  <a href={ad.link} target="_blank" rel="noreferrer" className="text-sm text-yellow-400">{ad.link}</a>
                )}
              </div>
              <div>
                <button onClick={() => deleteAd(ad.id)} className="text-red-500 hover:underline">ลบ</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
