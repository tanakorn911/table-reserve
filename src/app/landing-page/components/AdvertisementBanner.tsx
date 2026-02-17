"use client";

import React, { useEffect, useState, useRef } from 'react';

type Ad = {
  id: string;
  title: string;
  image_url: string;
  link?: string | null;
  active?: boolean;
};

export default function AdvertisementBanner() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchAds = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/ads');
        if (!res.ok) throw new Error('Failed to fetch ads');
        const json = await res.json();
        if (!mounted) return;
        const active = (json.data || []).filter((a: Ad) => a.active !== false);
        setAds(active);
        setIndex(0);
        // บันทึกลง localStorage เพื่อใช้เป็น cache เมื่อ Supabase ช้า/ล่ม
        try { localStorage.setItem('cache_ads', JSON.stringify(active)); } catch { }
      } catch (err) {
        console.warn('[Ads] Failed to fetch, using cached data');
        if (!mounted) return;
        // ลองอ่านจาก localStorage cache
        try {
          const cached = localStorage.getItem('cache_ads');
          if (cached) {
            const cachedAds = JSON.parse(cached) as Ad[];
            if (cachedAds.length > 0) {
              setAds(cachedAds);
              setIndex(0);
            }
          }
        } catch { }
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
    // ลด polling จาก 30s เป็น 60s เพื่อลดภาระ Supabase free tier
    const id = setInterval(fetchAds, 60000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    // auto-advance
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (!ads || ads.length <= 1) return;
    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % ads.length);
    }, 5000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [ads]);

  if (loading) return null;
  if (!ads || ads.length === 0) return null;

  const goPrev = () => setIndex((i) => (i - 1 + ads.length) % ads.length);
  const goNext = () => setIndex((i) => (i + 1) % ads.length);

  return (
    <div className="container mx-auto px-4 lg:px-6 my-6">
      <div className="relative w-full rounded-lg overflow-hidden shadow-lg bg-gray-800">
        <div className="aspect-[16/6] sm:aspect-[16/6] md:aspect-[21/8] lg:aspect-[21/7] w-full">
          {ads.map((ad, i) => (
            <div
              key={ad.id}
              className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            >
              {ad.link ? (
                <a href={ad.link} target="_blank" rel="noreferrer">
                  <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                </a>
              ) : (
                <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
              )}
              <div className="absolute left-4 bottom-4 bg-black/50 text-white px-3 py-1 rounded">
                <span className="text-sm font-semibold">{ad.title}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <button
          onClick={goPrev}
          aria-label="Previous ad"
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2"
        >
          ‹
        </button>
        <button
          onClick={goNext}
          aria-label="Next ad"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2"
        >
          ›
        </button>

        {/* Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full ${i === index ? 'bg-yellow-400' : 'bg-white/40'}`}
              aria-label={`Go to ad ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
