'use client';
import { Utensils, QrCode } from 'lucide-react';

export default function MenuClient({
  restaurant,
  menuSections,
}: {
  restaurant: any;
  menuSections: any[];
}) {
  return (
    <div
      className="min-h-screen pb-16"
      style={{
        fontFamily: restaurant.font_family ?? 'Inter',
        backgroundColor: '#fff',
      }}
    >
      {/* Header */}
      <div
        className="w-full h-40 relative"
        style={{
          backgroundColor: restaurant.primary_color ?? '#f97316',
          backgroundImage: restaurant.banner_image
            ? `url(${restaurant.banner_image})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="text-center text-white">
            {restaurant.logo_image ? (
              <img
                src={restaurant.logo_image}
                alt={restaurant.name}
                className="w-16 h-16 object-contain mx-auto mb-2 rounded-full bg-white p-1"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white mx-auto mb-2 flex items-center justify-center">
                <Utensils
                  className="w-8 h-8"
                  style={{ color: restaurant.primary_color }}
                />
              </div>
            )}
            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {restaurant.description && (
          <p className="text-gray-600 text-center mb-8">
            {restaurant.description}
          </p>
        )}

        {menuSections.length ? (
          menuSections.map((section) => (
            <section key={section.id} className="mb-10">
              <h2
                className="text-xl font-bold pb-2 border-b mb-4"
                style={{ borderColor: restaurant.primary_color }}
              >
                {section.name}
              </h2>
              {section.menu_items
                .filter((item) => item.is_available)
                .sort((a, b) => a.display_order - b.display_order)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.description && (
                        <p className="text-gray-600 text-sm">{item.description}</p>
                      )}
                    </div>
                    <p className="font-medium">${item.price.toFixed(2)}</p>
                  </div>
                ))}
            </section>
          ))
        ) : (
          <div className="text-center py-12">
            <QrCode className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-medium">Menu Coming Soon</h2>
            <p className="text-gray-500 mt-2">
              This restaurant is still setting up their digital menu
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-xs mt-12">
        Powered by MenuQR
      </footer>
    </div>
  );
}
