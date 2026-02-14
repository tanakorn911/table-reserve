"use client";

import React, { useEffect, useState } from 'react';

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
  const [imageUrl, setImageUrl] = useState('');
  const [link, setLink] = useState('');

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ads');
      const json = await res.json();
      setAds(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const createAd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, image_url: imageUrl, link }),
      });
      const json = await res.json();
      if (res.ok) {
        setTitle('');
        setImageUrl('');
        setLink('');
        fetchAds();
      } else {
        alert(json.error || 'Failed to create ad');
      }
    } catch (err) {
      console.error(err);
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
        alert(json.error || 'Failed to delete ad');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">จัดการโฆษณา</h2>

      <form onSubmit={createAd} className="mb-6 space-y-2 max-w-md">
        <div>
          <label className="block text-sm">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm">Image URL</label>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm">Link (optional)</label>
          <input value={link} onChange={(e) => setLink(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">เพิ่มโฆษณา</button>
        </div>
      </form>

      <div>
        <h3 className="text-lg font-medium mb-2">รายการโฆษณา</h3>
        {loading && <div>Loading...</div>}
        {!loading && ads.length === 0 && <div>ยังไม่มีโฆษณา</div>}
        <ul className="space-y-4">
          {ads.map((ad) => (
            <li key={String(ad.id)} className="flex items-center gap-4 border p-3 rounded">
              <img src={ad.image_url} alt={ad.title} className="w-28 h-16 object-cover" />
              <div className="flex-1">
                <div className="font-semibold">{ad.title}</div>
                {ad.link && (
                  <a href={ad.link} target="_blank" rel="noreferrer" className="text-sm text-blue-600">{ad.link}</a>
                )}
              </div>
              <div>
                <button onClick={() => deleteAd(ad.id)} className="text-red-600">ลบ</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
