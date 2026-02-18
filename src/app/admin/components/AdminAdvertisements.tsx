"use client";

import React, { useEffect, useState, useRef } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n';

type Ad = {
  id: string | number;
  title: string;
  image_url: string;
  link?: string | null;
  active?: boolean;
  created_at?: string;
};

export default function AdminAdvertisements() {
  const { t } = useTranslation();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [editUploading, setEditUploading] = useState(false);

  // ใช้ useRef เพื่อให้ supabase client ไม่ถูกสร้างใหม่ทุก render
  const supabaseRef = useRef(createClientSupabaseClient());
  const supabase = supabaseRef.current;

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
      setError(t('admin.advertisements.error.connect'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // โหลดข้อมูลครั้งแรก
    fetchAds();

    // Subscribe Realtime จาก Supabase
    const channel = supabase
      .channel('advertisements-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'advertisements' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAds((prev) => [payload.new as Ad, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setAds((prev) =>
              prev.map((ad) =>
                String(ad.id) === String((payload.new as Ad).id) ? (payload.new as Ad) : ad
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setAds((prev) =>
              prev.filter((ad) => String(ad.id) !== String((payload.old as Ad).id))
            );
          }
        }
      )
      .subscribe();

    // Cleanup เมื่อ Component ถูก Unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // [] ทำให้รันแค่ครั้งเดียว

  const createAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title || title.trim().length === 0) {
      setError(t('admin.advertisements.error.fill'));
      return;
    }
    if (!selectedFile) {
      setError(t('admin.advertisements.error.file'));
      return;
    }
    setUploading(true);
    try {
      const ext = selectedFile.name.split('.').pop();
      const filePath = `advertisements/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('advertisements')
        .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false });
      if (uploadError) {
        setError(uploadError.message || t('alert.uploadFailed'));
        setUploading(false);
        return;
      }
      const { data: publicData } = await supabase.storage.from('advertisements').getPublicUrl(filePath);
      const publicUrl = (publicData as any)?.publicUrl;
      if (!publicUrl) {
        setError(t('alert.uploadFailed'));
        setUploading(false);
        return;
      }
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), image_url: publicUrl, link }),
      });
      const json = await res.json();
      if (res.ok) {
        // ล้างฟอร์ม (Realtime จะอัปเดต list เองอัตโนมัติ)
        setTitle('');
        setSelectedFile(null);
        setImagePreview(null);
        setLink('');
      } else {
        setError(json.error || t('alert.failed'));
      }
    } catch (err) {
      console.error(err);
      setError(t('admin.advertisements.error.connect'));
    } finally {
      setUploading(false);
    }
  };

  const deleteAd = async (id: string | number) => {
    if (!confirm(t('admin.advertisements.confirm.delete'))) return;
    try {
      const res = await fetch('/api/ads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || t('alert.failed'));
      }
    } catch (err) {
      console.error(err);
      setError(t('admin.advertisements.error.connect'));
    }
  };

  const openEdit = (ad: Ad) => {
    setEditingAd(ad);
    setEditTitle(ad.title);
    setEditLink(ad.link || '');
    setEditFile(null);
    setEditPreview(ad.image_url);
  };

  const closeEdit = () => {
    setEditingAd(null);
    setEditTitle('');
    setEditLink('');
    setEditFile(null);
    setEditPreview(null);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAd) return;
    if (!editTitle || editTitle.trim().length === 0) {
      setError(t('admin.advertisements.error.fill'));
      return;
    }
    setEditUploading(true);
    try {
      let imageUrl = editingAd.image_url;
      if (editFile) {
        const ext = editFile.name.split('.').pop();
        const filePath = `advertisements/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('advertisements')
          .upload(filePath, editFile, { cacheControl: '3600', upsert: false });
        if (uploadError) {
          setError(uploadError.message || t('alert.uploadFailed'));
          setEditUploading(false);
          return;
        }
        const { data: publicData } = await supabase.storage.from('advertisements').getPublicUrl(filePath);
        imageUrl = (publicData as any)?.publicUrl || imageUrl;
      }
      const res = await fetch('/api/ads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAd.id,
          title: editTitle.trim(),
          image_url: imageUrl,
          link: editLink,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        closeEdit();
      } else {
        setError(json.error || t('alert.failed'));
      }
    } catch (err) {
      console.error(err);
      setError(t('admin.advertisements.error.connect'));
    } finally {
      setEditUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Edit Modal */}
      {editingAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-black text-primary uppercase tracking-tight">แก้ไขโฆษณา</h3>
              <button onClick={closeEdit} className="text-muted-foreground hover:text-foreground transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={saveEdit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  {t('admin.advertisements.form.title')}
                </label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  {t('admin.advertisements.form.link')}
                </label>
                <input
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-muted border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  {t('admin.advertisements.form.image')}
                </label>
                {editPreview && (
                  <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-border mb-2">
                    <img src={editPreview} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="cursor-pointer bg-primary/10 text-primary border border-primary/20 px-6 py-3 rounded-xl font-bold hover:bg-primary/20 transition-all flex items-center gap-2 w-fit">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setEditFile(f);
                      if (f) setEditPreview(URL.createObjectURL(f));
                    }}
                    className="hidden"
                  />
                  <span>{editFile ? editFile.name : 'เปลี่ยนรูปภาพ'}</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={editUploading}
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {editUploading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="flex-1 bg-muted text-muted-foreground py-3 rounded-xl font-black uppercase tracking-widest hover:bg-muted/80 transition-all"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Form */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-black text-primary uppercase tracking-tight mb-6">
          {t('admin.advertisements.title')}
        </h2>
        <form onSubmit={createAd} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                {t('admin.advertisements.form.title')}
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('admin.advertisements.form.title')}
                className="w-full bg-muted border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                {t('admin.advertisements.form.link')}
              </label>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="w-full bg-muted border border-border rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider block">
                {t('admin.advertisements.form.image')}
              </label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-primary/10 text-primary border border-primary/20 px-6 py-3 rounded-xl font-bold hover:bg-primary/20 transition-all flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setSelectedFile(f);
                      if (f) {
                        setImagePreview(URL.createObjectURL(f));
                      } else {
                        setImagePreview(null);
                      }
                    }}
                    className="hidden"
                  />
                  <span>{selectedFile ? selectedFile.name : t('admin.advertisements.form.selectFile')}</span>
                </label>
              </div>
            </div>
            {imagePreview && (
              <div className="relative w-full aspect-video md:w-80 overflow-hidden rounded-2xl border-4 border-muted shadow-lg">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={uploading}
              className="w-full md:w-auto bg-primary text-primary-foreground px-10 py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {uploading ? t('admin.advertisements.form.uploading') : t('admin.advertisements.form.submit')}
            </button>
          </div>
        </form>
      </div>

      {/* Ad List */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
          {t('admin.advertisements.list.title')}
          <span className="text-xs font-normal text-muted-foreground lowercase">({ads.length})</span>
          <span className="flex items-center gap-1 text-xs font-normal text-green-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block"></span>
            realtime
          </span>
        </h3>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex flex-col gap-2">
            <div className="font-bold flex items-center gap-2 text-sm uppercase">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {t('admin.advertisements.error.title')}
            </div>
            <div className="text-sm">{error}</div>
          </div>
        )}

        {loading && <div className="text-center py-12 text-muted-foreground animate-pulse">{t('common.loading')}</div>}

        {!loading && ads.length === 0 && !error && (
          <div className="text-center py-20 bg-muted/30 border border-dashed border-border rounded-3xl text-muted-foreground">
            {t('admin.advertisements.list.empty')}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map((ad) => (
            <div key={String(ad.id)} className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="relative aspect-video overflow-hidden">
                <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <div className="text-white font-bold truncate w-full">{ad.title}</div>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 truncate">
                  {ad.link ? (
                    <a href={ad.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 100-2H5z" />
                      </svg>
                      {ad.link}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No link</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(ad)}
                    className="text-xs font-bold text-blue-500 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={() => deleteAd(ad.id)}
                    className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    {t('admin.advertisements.list.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}