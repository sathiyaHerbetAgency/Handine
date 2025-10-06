import { createClient } from "../../../../../../supabase/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import PreviewControls from "./PreviewControls";

export default async function PreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/sign-in");

  // Restaurant
  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !restaurant) return notFound();

  const primaryColor: string = restaurant.primary_color || "#F97316";
  const logoUrl: string | undefined = restaurant.logo_image || undefined;
  const coverUrl: string | undefined = restaurant.banner_image || undefined;
  const menuUrl = `/menu/${params.id}`;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button variant="ghost" asChild className="mb-2">
            <Link href={`/dashboard/restaurants/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Restaurant
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Menu Preview</h1>
          <p className="text-muted-foreground mt-1">
            This is how your menu will appear to customers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild className="bg-orange-600 hover:bg-orange-700">
            <Link href={menuUrl} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in New Tab
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero (no negative margins; title sits inside) */}
      <div className="relative mb-6 overflow-hidden rounded-xl border">
        <div className="relative h-44 sm:h-56 md:h-64">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`${restaurant.name} cover`}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${shadeColor(
                  primaryColor,
                  -15
                )} 100%)`,
              }}
            />
          )}

          {/* Gradients for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />

          {/* Content pinned inside cover – bottom-left */}
          <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
            <div className="inline-flex items-center gap-3 rounded-xl border border-white/40 bg-white/70 backdrop-blur-md px-3 py-2 shadow-sm">
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-white ring-1 ring-black/5">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`${restaurant.name} logo`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full grid place-items-center text-xs text-muted-foreground">
                    Logo
                  </div>
                )}
              </div>
              <div className="leading-tight">
                <div className="text-base sm:text-lg font-semibold text-gray-900">
                  {restaurant.name}
                </div>
                {restaurant.description && (
                  <div className="text-xs sm:text-sm text-gray-700 line-clamp-1">
                    {restaurant.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Preview Frame */}
      <PreviewControls menuUrl={menuUrl} accent={primaryColor} />
    </div>
  );
}

/** Small color helper */
function shadeColor(hex: string, percent: number) {
  const f = hex.startsWith("#") ? hex.slice(1) : hex;
  const num = parseInt(f, 16);
  const r = (num >> 16) + percent;
  const g = ((num >> 8) & 0x00ff) + percent;
  const b = (num & 0x0000ff) + percent;
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  return `#${((clamp(r) << 16) | (clamp(g) << 8) | clamp(b))
    .toString(16)
    .padStart(6, "0")}`;
}
