"use client";

import React, { useEffect, useState } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import { useAdminLocale, adminT as t } from './LanguageSwitcher';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  LinkIcon,
  PhotoIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

type Ad = {
  id: string | number;
  title: string;
  image_url: string;
  link?: string | null;
  active?: boolean;
  created_at?: string;
};

export default function AdminAdvertisements() {
  const locale = useAdminLocale();

  // State variables
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [currentAdId, setCurrentAdId] = useState<string | number | null>(null);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // Direct URL
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [togglingId, setTogglingId] = useState<string | number | null>(null);

  const supabase = createClientSupabaseClient();

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ads');
      const json = await res.json();
      if (json.error) {
        alert(json.error);
        setError(json.error);
        setAds([]);
      } else {
        setAds(json.data || []);
        setError(null);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = t('admin.advertisements.error.connect', locale);
      alert(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('admin-ads-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'advertisements' },
        () => {
          fetchAds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-clear success/error messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Clear form
  const resetForm = () => {
    setTitle('');
    setLink('');
    setImageUrl('');
    setSelectedFile(null);
    setImagePreview(null);
    setIsEditing(false);
    setCurrentAdId(null);
    setImageMode('upload');
  };

  const handleEdit = (ad: Ad) => {
    setIsEditing(true);
    setCurrentAdId(ad.id);
    setTitle(ad.title);
    setLink(ad.link || '');
    setImageUrl(ad.image_url);
    setImagePreview(ad.image_url);
    setImageMode('url');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      alert(t('admin.advertisements.error.fill', locale));
      return;
    }

    if (imageMode === 'upload' && !selectedFile && !isEditing) {
      alert(t('admin.advertisements.error.file', locale));
      return;
    }

    if (imageMode === 'url' && !imageUrl.trim()) {
      alert(t('admin.advertisements.error.fillURL', locale) || 'Please enter image URL');
      return;
    }

    setUploading(true);
    try {
      let finalImageUrl = imageUrl;

      // Only upload if in upload mode and a file is selected
      if (imageMode === 'upload' && selectedFile) {
        const ext = selectedFile.name.split('.').pop();
        const filePath = `advertisements/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('advertisements')
          .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: publicData } = supabase.storage.from('advertisements').getPublicUrl(filePath);
        finalImageUrl = publicData.publicUrl;
      }

      const payload = {
        id: currentAdId,
        title: title.trim(),
        image_url: finalImageUrl,
        link: link.trim() || null,
        active: true,
      };

      const res = await fetch('/api/ads', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok) {
        const successMsg = isEditing ? t('admin.advertisements.success.updated', locale) : t('admin.advertisements.success.created', locale);
        alert(successMsg);
        setSuccess(successMsg);
        resetForm();
        fetchAds();
      } else {
        const errorMsg = json.error || t('alert.failed', locale);
        alert(errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.message || t('admin.advertisements.error.connect', locale);
      alert(errorMsg);
      setError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const deleteAd = async (id: string | number) => {
    if (!confirm(t('admin.advertisements.confirm.delete', locale))) return;
    try {
      const res = await fetch('/api/ads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchAds();
        const successMsg = t('admin.advertisements.success.deleted', locale);
        alert(successMsg);
        setSuccess(successMsg);
      } else {
        const json = await res.json();
        const errorMsg = json.error || t('alert.failed', locale);
        alert(errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = t('admin.advertisements.error.connect', locale);
      alert(errorMsg);
      setError(errorMsg);
    }
  };

  const toggleActive = async (ad: Ad) => {
    setTogglingId(ad.id);
    try {
      const res = await fetch('/api/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...ad,
          active: ad.active === false ? true : false
        }),
      });
      if (res.ok) {
        await fetchAds();
      } else {
        const json = await res.json();
        alert(json.error || t('alert.failed', locale));
      }
    } catch (err) {
      console.error(err);
      alert(t('admin.advertisements.error.connect', locale));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Form Card */}
      <div className="bg-card border border-border rounded-3xl p-8 shadow-warm-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <PhotoIcon className="w-32 h-32" />
        </div>

        {isEditing && (
          <div className="flex items-center gap-4 mb-8 bg-primary/5 p-4 rounded-2xl border border-primary/10">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <PencilIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground tracking-tight">
                {t('admin.advertisements.editTitle', locale)}
              </h2>
              <p className="text-xs text-muted-foreground font-medium">
                {t('admin.advertisements.updateSubtitle', locale)}
              </p>
            </div>
            <button
              onClick={resetForm}
              className="ml-auto text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-2 bg-background/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-border shadow-sm"
            >
              <XMarkIcon className="w-4 h-4" />
              {t('admin.advertisements.cancelEdit', locale)}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-1">
                {t('admin.advertisements.form.title', locale)}
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('admin.advertisements.form.titlePlaceholder', locale)}
                className="w-full bg-muted/50 border-2 border-border rounded-2xl p-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-1">
                {t('admin.advertisements.form.link', locale)}
              </label>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder={t('admin.advertisements.form.linkPlaceholder', locale)}
                className="w-full bg-muted/50 border-2 border-border rounded-2xl p-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-lg"
              />
              <p className="text-[10px] text-muted-foreground font-medium px-1">
                {t('admin.advertisements.form.linkHint', locale)}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-1">
              {t('admin.advertisements.form.imageContent', locale)}
            </label>

            <div className="flex gap-2 p-1 bg-muted rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${imageMode === 'upload' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t('admin.advertisements.form.uploadFile', locale)}
              </button>
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${imageMode === 'url' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t('admin.advertisements.form.directUrl', locale)}
              </button>
            </div>

            {imageMode === 'upload' ? (
              <div className="flex items-center gap-4">
                <label className="cursor-pointer group flex items-center justify-center gap-4 w-full md:w-auto px-8 py-4 bg-muted/30 border-2 border-dashed border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all outline-none">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setSelectedFile(f);
                      if (f) {
                        const url = URL.createObjectURL(f);
                        setImagePreview(url);
                        setImageUrl(''); // Clear URL if uploading
                      }
                    }}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PhotoIcon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-bold text-foreground truncate max-w-[200px]">
                    {selectedFile ? selectedFile.name : t('admin.advertisements.form.selectFile', locale)}
                  </span>
                </label>
              </div>
            ) : (
              <div className="space-y-1">
                <input
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreview(e.target.value);
                    setSelectedFile(null); // Clear file if URL used
                  }}
                  placeholder={t('admin.advertisements.form.urlPlaceholder', locale)}
                  className="w-full bg-muted/50 border-2 border-border rounded-2xl p-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold"
                />
              </div>
            )}
            <p className="text-[10px] text-muted-foreground font-medium px-1">
              {t('admin.advertisements.form.imageHint', locale)}
            </p>

            {imagePreview && (
              <div className="relative w-full max-w-xl aspect-video overflow-hidden rounded-[2rem] border-4 border-muted shadow-warm-xl group">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => { setSelectedFile(null); setImagePreview(null); setImageUrl(''); }}
                    className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-all scale-75 group-hover:scale-100 duration-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary text-primary-foreground px-12 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  {t('admin.advertisements.form.processing', locale)}
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5" />
                  {isEditing ? t('admin.advertisements.form.saveChanges', locale) : t('admin.advertisements.form.submit', locale)}
                </>
              )}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-8 py-4 rounded-2xl font-bold text-muted-foreground border-2 border-border hover:bg-muted/50 transition-all"
              >
                {t('admin.advertisements.form.discard', locale)}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3 px-2">
            {t('admin.advertisements.list.title', locale)}
            <span className="text-sm font-bold px-3 py-1 bg-muted rounded-full text-muted-foreground lowercase">
              {ads.length} {t('admin.advertisements.list.itemsCount', locale)}
            </span>
          </h3>
          <button
            onClick={fetchAds}
            className="p-2 text-muted-foreground hover:text-primary transition-colors"
            title="Refresh"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-2">
            <XMarkIcon className="w-6 h-6 flex-shrink-0" />
            <div className="font-bold text-sm tracking-tight">{error}</div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-2">
            <CheckIcon className="w-6 h-6 flex-shrink-0" />
            <div className="font-bold text-sm tracking-tight">{success}</div>
          </div>
        )}

        {loading && ads.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-muted/30 aspect-video rounded-3xl animate-pulse border border-border"></div>
            ))}
          </div>
        )}

        {!loading && ads.length === 0 && !error && (
          <div className="text-center py-32 bg-muted/20 border-4 border-dashed border-border rounded-[3rem] text-muted-foreground group">
            <PhotoIcon className="w-16 h-16 mx-auto mb-4 opacity-20 group-hover:opacity-40 transition-opacity" />
            <p className="text-lg font-bold">{t('admin.advertisements.list.empty', locale)}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ads.map((ad) => (
            <div key={String(ad.id)} className="group bg-card border-2 border-border/60 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-warm-xl hover:border-primary/30 transition-all duration-500">
              <div className="relative aspect-video overflow-hidden">
                <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
                  <div className="text-white">
                    <div className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">{t('admin.advertisements.list.cardLabel', locale)}</div>
                    <div className="text-xl font-black truncate w-full leading-tight">{ad.title}</div>
                  </div>
                </div>

                {/* ID Badge */}
                <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full border border-white/20">
                  ID: {String(ad.id).substring(0, 6)}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${ad.active !== false ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-400'}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    {ad.active !== false ? t('admin.advertisements.status.on', locale) : t('admin.advertisements.status.off', locale)}
                  </span>
                </div>

                <div className="h-12 flex flex-col justify-center">
                  {ad.link ? (
                    <a
                      href={ad.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-primary bg-primary/5 p-2 rounded-xl flex items-center gap-2 hover:bg-primary/10 transition-colors truncate"
                    >
                      <LinkIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{ad.link}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground italic font-medium px-2 flex items-center gap-2">
                      <XMarkIcon className="w-4 h-4" />
                      {t('admin.advertisements.list.noLink', locale)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => toggleActive(ad)}
                    disabled={togglingId === ad.id}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${ad.active !== false
                      ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 shadow-sm border border-amber-500/20'
                      : 'bg-green-500/10 text-green-600 hover:bg-green-500/20 shadow-sm border border-green-500/20'
                      } disabled:opacity-50`}
                    title={ad.active !== false ? 'Turn Off' : 'Turn On'}
                  >
                    {togglingId === ad.id ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : ad.active !== false ? (
                      <>
                        <EyeSlashIcon className="w-4 h-4" />
                        {t('admin.advertisements.status.off', locale)}
                      </>
                    ) : (
                      <>
                        <EyeIcon className="w-4 h-4" />
                        {t('admin.advertisements.status.on', locale)}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(ad)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-muted text-foreground hover:bg-muted/80 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-border"
                  >
                    <PencilIcon className="w-4 h-4" />
                    {t('admin.advertisements.list.edit', locale)}
                  </button>
                  <button
                    onClick={() => deleteAd(ad.id)}
                    className="flex-none p-3 text-red-500 hover:text-white hover:bg-red-500 bg-red-500/5 border border-red-500/10 rounded-2xl transition-all"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
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