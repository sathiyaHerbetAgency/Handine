import { createClient } from "../../../../supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
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
  image_url?: string | null; // 👈 added
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

  // ——— Check subscription status —————————————————————————————————
  if (restaurant.status !== "active") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-lg font-semibold mb-6">
          Your subscription has expired.
        </p>
      </div>
    );
  }

  // ——— Fetch menu sections + items (incl. image_url) —————————————
  const { data: rawSections, error: sectionsError } = await supabase
    .from("menu_sections")
    .select(
      `
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
        display_order,
        image_url
      )
    `
    )
    .eq("restaurant_id", restaurant.id)
    .order("display_order", { ascending: true });

  if (sectionsError) {
    console.error(sectionsError);
    return notFound();
  }

  const menuSections: MenuSection[] = rawSections ?? [];

  // ——— Record a view ————————————————————————————————————————
  await supabase.from("menu_views").insert({ restaurant_id: restaurant.id });

  // ——— Prepare theming & URL ——————————————————————————————————
  const fontFamily = restaurant.font_family || "Inter";
  const accent = restaurant.primary_color || "#f97316";
  const cover = restaurant.banner_image || null;
  const logo = restaurant.logo_image || null;

  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "";
  const shareUrl = `${base}/menu/${id}`;

  // ——— Render ——————————————————————————————————————————————————
  return (
    <div
      className="min-h-screen pb-16 touch-pan-y"
      style={{ fontFamily, backgroundColor: "#fff" }}
    >
      {/* Header / Cover */}
      <header className="w-full">
        <div className="relative h-44 sm:h-56 md:h-64 overflow-hidden">
          {cover ? (
            <img
              src={cover}
              alt={`${restaurant.name} cover`}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${accent} 0%, ${shadeColor(
                  accent,
                  -15
                )} 100%)`,
              }}
            />
          )}
          {/* readability gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />

          {/* Brand card */}
          <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
            <div className="mx-auto max-w-3xl">
              <div className="inline-flex items-center gap-3 rounded-xl border border-white/40 bg-white/75 backdrop-blur-md px-3 py-2 shadow-sm">
                <div className="h-12 w-12 rounded-lg overflow-hidden bg-white ring-1 ring-black/5">
                  {logo ? (
                    <img
                      src={logo}
                      alt={`${restaurant.name} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center">
                      <Utensils className="w-6 h-6" style={{ color: accent }} />
                    </div>
                  )}
                </div>
                <div className="leading-tight">
                  <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                    {restaurant.name}
                  </h1>
                  {restaurant.tagline ? (
                    <p className="text-xs sm:text-sm text-gray-700 line-clamp-1">
                      {restaurant.tagline}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Share bar with menu URL (mobile-friendly) */}
        <div className="px-4">
          <div className="mx-auto max-w-3xl -mt-3 flex items-center justify-between rounded-lg border bg-white px-3 py-2 shadow-sm">
            <span className="text-xs sm:text-sm truncate text-gray-600">
              <span className="mr-1 font-medium">Menu URL:</span>
              <Link
                href={`/menu/${id}`}
                className="underline underline-offset-2 decoration-dotted"
                title={shareUrl}
              >
                {shareUrl}
              </Link>
            </span>
            <div
              className="ml-3 h-6 w-6 shrink-0 rounded bg-gray-100 grid place-items-center"
              title="Scan on phone"
            >
              <QrCode className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>
      </header>

      {/* Menu */}
      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        {menuSections.length > 0 ? (
          menuSections.map((section) => {
            const secDisc = section.discount_percent || 0;
            const hasSectionDiscount = secDisc > 0;

            const items = (section.menu_items || [])
              .filter((it) => it.is_available)
              .sort((a, b) => a.display_order - b.display_order);

            return (
              <section key={section.id} className="mb-10">
                <div className="flex items-baseline justify-between">
                  <h2
                    className="text-[17px] sm:text-lg font-semibold tracking-tight"
                    style={{ color: "#111827" }}
                  >
                    {section.name}
                  </h2>
                  {hasSectionDiscount && (
                    <span
                      className="text-[11px] sm:text-xs font-medium rounded-full px-2 py-0.5"
                      style={{
                        backgroundColor: `${hexToRgba(accent, 0.12)}`,
                        color: accent,
                      }}
                    >
                      {secDisc}% off
                    </span>
                  )}
                </div>
                {section.description && (
                  <p className="text-[13px] text-gray-600 mt-1">
                    {section.description}
                  </p>
                )}

                <div className="mt-4 space-y-3">
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
                        className="rounded-xl border bg-white p-3 sm:p-4 shadow-sm hover:shadow transition-shadow"
                      >
                        <div className="flex gap-3">
                          {/* Thumbnail (left) */}
                          <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-md overflow-hidden border bg-gray-50 shrink-0">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full grid place-items-center text-[10px] text-gray-400">
                                No Image
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="text-[15px] sm:text-base font-medium leading-tight">
                                  {item.name}
                                </h3>
                                {item.description && (
                                  <p className="mt-1 text-[12px] sm:text-sm text-gray-600 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                              </div>

                              {/* Price block */}
                              <div className="text-right shrink-0">
                                {hasDiscount ? (
                                  <div className="leading-tight">
                                    <div className="text-[11px] text-gray-400 line-through">
                                      ₹{item.price.toFixed(2)}
                                    </div>
                                    <div
                                      className="text-[14px] sm:text-[15px] font-semibold"
                                      style={{ color: accent }}
                                    >
                                      ₹{finalPrice.toFixed(2)}
                                    </div>
                                    <div
                                      className="text-[11px]"
                                      style={{ color: accent }}
                                    >
                                      ({effectiveDisc}% off)
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-[14px] sm:text-[15px] font-semibold text-gray-900">
                                    ₹{item.price.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
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
            <h2 className="text-lg font-medium">Menu Coming Soon</h2>
            <p className="text-gray-500 mt-2">
              This restaurant is still setting up their digital menu
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-xs mt-10 mb-6 px-4">
        <p>Powered by MenuQR</p>
      </footer>
    </div>
  );
}

/* ——— helpers ——— */
function shadeColor(hex: string, percent: number) {
  const f = hex?.startsWith("#") ? hex.slice(1) : hex || "f97316";
  const num = parseInt(f, 16);
  const r = (num >> 16) + percent;
  const g = ((num >> 8) & 0x00ff) + percent;
  const b = (num & 0x0000ff) + percent;
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  return `#${((clamp(r) << 16) | (clamp(g) << 8) | clamp(b)).toString(16).padStart(6, "0")}`;
}
function hexToRgba(hex: string, alpha = 1) {
  const h = hex.replace("#", "");
  const bigint = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
