import React from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

interface HeroSectionProps {
    restaurantName: string;
    tagline: string;
    heroImage: string;
    heroImageAlt: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
    restaurantName,
    tagline,
    heroImage,
    heroImageAlt,
}) => {
    return (
        <section className="relative w-full h-[600px] lg:h-[700px] overflow-hidden">
            <div className="absolute inset-0">
                <AppImage
                    src={heroImage}
                    alt={heroImageAlt}
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background/90" />
            </div>

            <div className="relative container mx-auto px-4 lg:px-6 h-full flex flex-col justify-center items-center text-center">
                <div className="max-w-4xl space-y-6">
                    <h1 className="text-5xl lg:text-6xl xl:text-7xl font-heading font-bold text-white drop-shadow-lg">
                        {restaurantName}
                    </h1>

                    <p className="text-xl lg:text-2xl text-white/90 font-medium drop-shadow-md">{tagline}</p>

                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/reservation-form"
                            className="
                                inline-flex items-center gap-3 px-10 py-5 rounded-lg text-lg font-bold
                                bg-accent text-accent-foreground shadow-warm-lg
                                transition-all hover:shadow-warm-xl hover:-translate-y-1
                                active:scale-[0.97]
                            "
                        >
                            <Icon name="CalendarIcon" size={24} />
                            <span>จองโต๊ะเลย</span>
                        </Link>

                        <Link
                            href="/check-status"
                            className="
                                inline-flex items-center gap-3 px-10 py-5 rounded-lg text-lg font-bold
                                bg-white/10 backdrop-blur-md text-white border border-white/20
                                transition-all hover:bg-white/20 hover:-translate-y-1
                                active:scale-[0.97]
                            "
                        >
                            <Icon name="MagnifyingGlassIcon" size={24} />
                            <span>ตรวจสอบสถานะ</span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
