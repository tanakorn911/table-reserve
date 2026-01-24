import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface InfoCard {
  icon: string;
  title: string;
  description: string;
}

interface RestaurantInfoProps {
  cards: InfoCard[];
}

const RestaurantInfo: React.FC<RestaurantInfoProps> = ({ cards }) => {
  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            ทำไมต้องเลือกเรา
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            สัมผัสประสบการณ์การรับประทานอาหารที่ยอดเยี่ยมด้วยความมุ่งมั่นของเราในด้านคุณภาพ
            การบริการ และบรรยากาศ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((card, index) => (
            <div
              key={index}
              className="
                bg-card rounded-xl p-8 shadow-warm-md
                transition-smooth hover:shadow-warm-lg hover:-translate-y-1
              "
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <Icon name={card.icon} size={32} className="text-primary" />
                </div>
                <h3 className="text-2xl font-heading font-semibold text-foreground">
                  {card.title}
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RestaurantInfo;
