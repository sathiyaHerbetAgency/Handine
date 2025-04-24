import { createClient } from "../../../../../supabase/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Edit,
  PlusCircle,
  QrCode,
  Settings,
  Trash,
} from "lucide-react";
import Link from "next/link";
import RestaurantMenuBuilder from "@/components/restaurant/menu-builder";
import RestaurantSettings from "@/components/restaurant/settings";

export default async function RestaurantPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch restaurant data
  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !restaurant) {
    return notFound();
  }

  // Fetch menu sections
  const { data: menuSections } = await supabase
    .from("menu_sections")
    .select("*, menu_items(*)")
    .eq("restaurant_id", restaurant.id)
    .order("display_order", { ascending: true });

  // Fetch QR codes
  const { data: qrCodes } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("restaurant_id", restaurant.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Button variant="ghost" asChild className="mb-2">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{restaurant.name}</h1>
          {restaurant.description && (
            <p className="text-muted-foreground mt-1">
              {restaurant.description}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/restaurants/${restaurant.id}/qr-codes`}>
              <QrCode className="mr-2 h-4 w-4" /> QR Codes
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/restaurants/${restaurant.id}/preview`}>
              Preview Menu
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="menu" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="menu">Menu Builder</TabsTrigger>
          <TabsTrigger value="settings">Restaurant Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="space-y-6">
          <RestaurantMenuBuilder
            restaurant={restaurant}
            initialSections={menuSections || []}
          />
        </TabsContent>

        <TabsContent value="settings">
          <RestaurantSettings restaurant={restaurant} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
