"use client";

import React, { useEffect, useState, useRef } from 'react';
import { createClientSupabaseClient } from '@/lib/supabase/client';
import {
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

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
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<number | null>(null);
  const supabase = createClientSupabaseClient();

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ads');
      if (!res.ok) throw new Error('Failed to fetch ads');
      const json = await res.json();
      const active = (json.data || []).filter((a: Ad) => a.active !== false);
      setAds(active);
      try { localStorage.setItem('cache_ads', JSON.stringify(active)); } catch { }
    } catch (err) {
      console.warn('[Ads] Failed to fetch, using cached data');
      try {
        const cached = localStorage.getItem('cache_ads');
        if (cached) {
          const cachedAds = JSON.parse(cached) as Ad[];
          if (cachedAds.length > 0) {
            setAds(cachedAds);
          }
        }
      } catch { }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('realtime-ads')
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

  useEffect(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (!ads || ads.length <= 1 || isHovered) return;

    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % ads.length);
    }, 5000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [ads, isHovered]);

  if (loading && ads.length === 0) return (
    <div className="container mx-auto px-4 lg:px-6 my-6">
      <div className="w-full aspect-[21/6] rounded-2xl bg-muted animate-pulse"></div>
    </div>
  );

  if (!ads || ads.length === 0) return null;

  const goPrev = () => setIndex((i) => (i - 1 + ads.length) % ads.length);
  const goNext = () => setIndex((i) => (i + 1) % ads.length);

  return (
    <div
      className="container mx-auto px-4 lg:px-6 my-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full rounded-[1.5rem] overflow-hidden shadow-lg bg-black/5 border border-border group">
        <div className="aspect-[16/6] md:aspect-[21/5] lg:aspect-[21/4.5] w-full">
          {ads.map((ad, i) => (
            <div
              key={ad.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${i === index ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}
            >
              {ad.link ? (
                <a href={ad.link} target="_blank" rel="noreferrer" className="block w-full h-full">
                  <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-40"></div>
                </a>
              ) : (
                <>
                  <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-40"></div>
                </>
              )}

              {/* Floating Caption - Slimmer version */}
              <div className={`absolute left-4 bottom-4 md:left-8 md:bottom-8 transition-all duration-700 delay-300 ${i === index ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <div className="backdrop-blur-md bg-black/40 border border-white/20 px-4 py-1.5 rounded-xl">
                  <span className="text-white text-sm md:text-lg font-bold tracking-tight">
                    {ad.title}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Buttons - Smaller and more subtle */}
        {ads.length > 1 && (
          <>
            <button
              onClick={goPrev}
              aria-label="Previous advertisement"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center backdrop-blur-md bg-black/20 hover:bg-black/40 text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 z-20"
            >
              <ChevronLeftIcon className="w-4 h-4 stroke-[3]" />
            </button>
            <button
              onClick={goNext}
              aria-label="Next advertisement"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center backdrop-blur-md bg-black/20 hover:bg-black/40 text-white rounded-lg transition-all opacity-0 group-hover:opacity-100 z-20"
            >
              <ChevronRightIcon className="w-4 h-4 stroke-[3]" />
            </button>
          </>
        )}

        {/* Pagination Indicators - Minimized */}
        {ads.length > 1 && (
          <div className="absolute bottom-4 right-4 md:right-8 flex gap-1 z-20">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`transition-all duration-500 rounded-full h-1 ${i === index ? 'w-4 bg-white' : 'w-1 bg-white/40 hover:bg-white/60'}`}
                aria-label={`Show advertisement ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Trust Sub-line - Minimized and moved closer */}
      <div className="flex items-center justify-center mt-2.5 gap-4 opacity-30">
        <span className="text-[9px] font-bold uppercase tracking-wider">{loading ? 'Syncing...' : 'Realtime Promo'}</span>
        <div className="w-1 h-1 rounded-full bg-border"></div>
        <span className="text-[9px] font-bold uppercase tracking-wider">Offers</span>
      </div>
    </div>
  );
}
