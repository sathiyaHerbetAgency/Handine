import { createClient } from "../../../../supabase/server";
import { notFound } from "next/navigation";
import { QrCode, Utensils } from "lucide-react";

export const dynamic = "force-dynamic";

//
// ——— Types —————————————————————————————————————————————————————————————
interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  discount_percent?: number;
  is_available: boolean;
  display_order: number;
}

interface MenuSection {
  id: string;
  name: string;
  description?: string;
  discount_percent?: number;
  display_order: number;
  menu_items: MenuItem[];
}

type Params = { params: { id: string } };

export default async function MenuPage({ params }: Params) {
  const supabase = await createClient();
  const { id } = params;

  // ——— Fetch restaurant ——————————————————————————————————————
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (restaurantError || !restaurant) {
    return notFound();
  }

  // ——— Fetch menu sections + items —————————————————————————————
  const { data: rawSections, error: sectionsError } = await supabase
    .from("menu_sections")   // no <...> here
    .select(`
      id,
      name,
      description,
      discount_percent,
      display_order,
      menu_items (
        id,
        name,
        description,
        price,
        discount_percent,
        is_available,
        display_order
      )
    `)
    .eq("restaurant_id", restaurant.id)
    .order("display_order", { ascending: true });

  if (sectionsError) {
    console.error(sectionsError);
    return notFound();
  }

  // One‐time cast to your clean type
  const menuSections: MenuSection[] = rawSections ?? [];

  // ——— Record a view ————————————————————————————————————————
  await supabase.from("menu_views").insert({ restaurant_id: restaurant.id });

  // ——— Render ——————————————————————————————————————————————————
  return (
    <div
      className="min-h-screen pb-16"
      style={{
        fontFamily: restaurant.font_family || "Inter",
        backgroundColor: "#fff",
      }}
    >
      {/* Header */}
      <div
        className="w-full h-40 bg-gray-200 relative"
        style={{
          backgroundColor: restaurant.primary_color || "#f97316",
          backgroundImage: restaurant.banner_image
            ? `url(${restaurant.banner_image})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
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
                  style={{ color: restaurant.primary_color || "#f97316" }}
                />
              </div>
            )}
            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {menuSections.length > 0 ? (
          menuSections.map((section) => {
            const secDisc = section.discount_percent || 0;
            const hasSectionDiscount = secDisc > 0;

            // filter & sort once per section
            const items = section.menu_items
              .filter((it) => it.is_available)
              .sort((a, b) => a.display_order - b.display_order);

            return (
              <section key={section.id} className="mb-12">
                <h2
                  className="text-xl font-bold pb-2 border-b flex items-center"
                  style={{ borderColor: restaurant.primary_color || "#f97316" }}
                >
                  {section.name}
                  {hasSectionDiscount && (
                    <span className="ml-2 text-red-600 text-sm">
                      ({secDisc}% off)
                    </span>
                  )}
                </h2>
                {section.description && (
                  <p className="text-gray-600 mb-4">
                    {section.description}
                  </p>
                )}

                <div className="space-y-6">
                  {items.map((item) => {
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
