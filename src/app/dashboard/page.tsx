import { createClient } from "../../../supabase/server";
import { InfoIcon, PlusCircle, QrCode, Utensils, Settings } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch user's restaurants
  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("user_id", user.id);

  // Check if user already has a restaurant
  const hasRestaurant = restaurants && restaurants.length > 0;

  return (
    <main className="w-full">
      <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Restaurant Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your digital menus and QR codes
            </p>
          </div>
          <Button
            asChild
            className="bg-orange-600 hover:bg-orange-700"
             disabled={hasRestaurant ?? false}
            title={
              hasRestaurant
                ? "You can only create one restaurant in the current plan"
                : "Create a new restaurant"
            }
          >
            <Link href={hasRestaurant ? "#" : "/dashboard/restaurants/new"}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Restaurant
            </Link>
          </Button>
        </header>

        {/* Welcome Card for New Users */}
        {(!restaurants || restaurants.length === 0) && (
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to MenuQR!</CardTitle>
              <CardDescription className="text-gray-700">
                Get started by creating your first restaurant profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <p>
                  Create a restaurant profile, design your menu, and generate QR
                  codes for your customers to scan.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-sm">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                      <Utensils className="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 className="font-medium">1. Create Restaurant</h3>
                    <p className="text-sm text-center text-gray-500 mt-1">
                      Add your restaurant details and branding
                    </p>
                  </div>
                  <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-sm">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                      <Settings className="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 className="font-medium">2. Build Your Menu</h3>
                    <p className="text-sm text-center text-gray-500 mt-1">
                      Add sections and items to your menu
                    </p>
                  </div>
                  <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-sm">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                      <QrCode className="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 className="font-medium">3. Generate QR Codes</h3>
                    <p className="text-sm text-center text-gray-500 mt-1">
                      Create and print QR codes for your tables
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <Link href="/dashboard/restaurants/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Your First
                  Restaurant
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Restaurant List */}
        {restaurants && restaurants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <Card
                key={restaurant.id}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-32 bg-orange-100 relative">
                  {restaurant.banner_image ? (
                    <img
                      src={restaurant.banner_image}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Utensils className="w-8 h-8 text-orange-300" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle>{restaurant.name}</CardTitle>
                  <CardDescription>
                    {restaurant.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" asChild>
                    <Link
                      href={`/dashboard/restaurants/${restaurant.id}/qr-codes`}
                    >
                      <QrCode className="mr-2 h-4 w-4" /> QR Codes
                    </Link>
                  </Button>
                  <Button asChild className="bg-orange-600 hover:bg-orange-700">
                    <Link href={`/dashboard/restaurants/${restaurant.id}`}>
                      Manage Menu
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}

            {/* Add New Restaurant Card - Hidden in current plan */}
            {false && (
              <Card className="border-dashed border-2 hover:border-orange-300 transition-colors flex flex-col items-center justify-center p-6 h-full">
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                  <PlusCircle className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="font-medium text-lg mb-2">
                  Add Another Restaurant
                </h3>
                <p className="text-sm text-center text-gray-500 mb-4">
                  Create a new restaurant profile and menu
                </p>
                <Button asChild variant="outline" className="mt-auto">
                  <Link href="/dashboard/restaurants/new">
                    Create Restaurant
                  </Link>
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Analytics Summary */}
        {restaurants && restaurants.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Menu Analytics</CardTitle>
              <CardDescription>
                Overview of your menu performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Total Views
                  </h3>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Active QR Codes
                  </h3>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Menu Items
                  </h3>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
