import { createClient, createPublicClient } from "../../../../supabase/server";
import { notFound } from "next/navigation";
import { QrCode, Utensils } from "lucide-react";

type Props = { searchParams: string };
export const dynamic = "force-dynamic";

export default async function MenuPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  // Grab the ID from the URL segment
  const { id } = params;

  // Fetch restaurant data
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // Fetch menu sections with items (including discount_percent on section)
  const { data: menuSections } = await supabase
    .from("menu_sections")
    .select("*, discount_percent, menu_items(*)")
    .eq("restaurant_id", restaurant?.id)
    .order("display_order", { ascending: true });

  // Record menu view for analytics
  await supabase.from("menu_views").insert({
    restaurant_id: restaurant?.id,
  });

  return (
    <div
      className="min-h-screen pb-16"
      style={{
        fontFamily: restaurant?.font_family || "Inter",
        backgroundColor: "#fff",
      }}
    >
      {/* Restaurant Header */}
      <div
        className="w-full h-40 bg-gray-200 relative"
        style={{
          backgroundColor: restaurant?.primary_color || "#f97316",
          backgroundImage: restaurant?.banner_image
            ? `url(${restaurant.banner_image})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="text-center text-white">
            {restaurant?.logo_image ? (
              <img
                src={restaurant.logo_image}
                alt={restaurant.name}
                className="w-16 h-16 object-contain mx-auto mb-2 rounded-full bg-white p-1"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white mx-auto mb-2 flex items-center justify-center">
                <Utensils
                  className="w-8 h-8"
                  style={{ color: restaurant?.primary_color || "#f97316" }}
                />
              </div>
            )}
            <h1 className="text-2xl font-bold">{restaurant?.name}</h1>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {menuSections?.length ? (
          menuSections.map((section) => {
            const secDisc = section.discount_percent || 0;
            const hasSectionDiscount = secDisc > 0;

            return (
              <section key={section.id} className="mb-12">
                {/* SECTION HEADER */}
                <h2
                    className="text-xl font-bold pb-2 border-b flex items-center"
                    style={{
                      borderColor: restaurant?.primary_color || "#f97316",
                    }}
                  >
                  {section.name}
                  {hasSectionDiscount && (
                    <span className="ml-2 text-red-600 text-sm">
                      ({secDisc}% off)
                    </span>
                  )}
                </h2>
                {section.description && (
                  <p className="text-gray-600 mb-4">{section.description}</p>
                )}

                {/* ITEMS */}
                <div className="space-y-6">
                  {(section.menu_items || [])
                    .filter<MenuItem>((i) => i.is_available)
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((item) => {
                      // Only consider item.discount_percent if section has none
                      const itemDisc = item.discount_percent || 0;
                      const effectiveDisc = hasSectionDiscount
                        ? secDisc
                        : itemDisc;
                      const hasDiscount = effectiveDisc > 0;
                      const finalPrice = hasDiscount
                        ? item.price * (1 - effectiveDisc / 100)
                        : item.price;

                      return (
                        <div
                          key={item.id}
                          className="flex justify-between items-center"
                        >
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            {item.description && (
                              <p className="text-gray-600 text-sm mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right font-medium">
                            {hasDiscount ? (
                              <>
                                <span className="line-through text-gray-500 mr-2">
                                  ₹{item.price.toFixed(2)}
                                </span>
                                <span>
                                  ₹{finalPrice.toFixed(2)}{" "}
                                  <small className="text-sm text-red-600">
                                    ({effectiveDisc}% off)
                                  </small>
                                </span>
                              </>
                            ) : (
                              <span>₹{item.price.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </section>
            );
          })
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
      <div className="text-center text-gray-500 text-xs mt-12">
        <p>Powered by MenuQR</p>
      </div>
    </div>
  );
}
