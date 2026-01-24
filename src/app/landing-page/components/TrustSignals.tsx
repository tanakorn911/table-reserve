import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface TrustBadge {
  icon: string;
  title: string;
  description: string;
}

interface TrustSignalsProps {
  badges: TrustBadge[];
}

const TrustSignals: React.FC<TrustSignalsProps> = ({ badges }) => {
  return (
    <section className="py-12 lg:py-16 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {badges.map((badge, index) => (
              <div key={index} className="flex flex-col items-center text-center space-y-3">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-success/10">
                  <Icon name={badge.icon} size={28} className="text-success" />
                </div>
                <h4 className="text-lg font-semibold text-foreground">{badge.title}</h4>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSignals;
