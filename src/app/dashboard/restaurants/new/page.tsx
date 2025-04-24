"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClientBrowser } from "../../../../../supabase/client";
import { useRouter } from "next/navigation";

export default function NewRestaurant() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientBrowser();

  // Check if user already has a restaurant
  const [hasRestaurant, setHasRestaurant] = useState(false);

  useEffect(() => {
    const checkExistingRestaurant = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();

        if (userData?.user) {
          const { data: restaurants } = await supabase
            .from("restaurants")
            .select("id")
            .eq("user_id", userData.user.id);

          if (restaurants && restaurants.length > 0) {
            setHasRestaurant(true);
            setError(
              "You can only create one restaurant in the current plan. Please upgrade your plan to add more restaurants.",
            );
          }
        }
      } catch (err) {
        console.error("Error checking existing restaurants:", err);
      }
    };

    checkExistingRestaurant();
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    primaryColor: "#f97316", // Default orange color
    fontFamily: "Inter",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Prevent submission if user already has a restaurant
      if (hasRestaurant) {
        setError(
          "You can only create one restaurant in the current plan. Please upgrade your plan to add more restaurants.",
        );
        return;
      }

      // Get current user
      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        router.push("/sign-in");
        return;
      }

      // Create restaurant
      const { data: restaurantData, error } = await supabase
        .from("restaurants")
        .insert({
          user_id: userData.user.id,
          name: formData.name,
          description: formData.description,
          primary_color: formData.primaryColor,
          font_family: formData.fontFamily,
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes("duplicate key")) {
          throw new Error(
            "You already have a restaurant with this name. Please choose a different name.",
          );
        }
        throw error;
      }

      // Redirect to the restaurant page
      router.push(`/dashboard/restaurants/${restaurantData.id}`);
    } catch (err: any) {
      console.error("Error creating restaurant:", err);
      setError(err.message || "Failed to create restaurant");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create New Restaurant</h1>
        <p className="text-muted-foreground mt-1">
          Set up your restaurant profile to get started
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Restaurant Details</CardTitle>
          <CardDescription>
            Enter the basic information about your restaurant
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Bistro Italiano"
                required
                 disabled={hasRestaurant ?? false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of your restaurant"
                rows={3}
                 disabled={hasRestaurant ?? false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="primaryColor"
                  name="primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  className="w-12 h-12 p-1"
                   disabled={hasRestaurant ?? false}
                />
                <Input
                  type="text"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  name="primaryColor"
                  className="flex-1"
                   disabled={hasRestaurant ?? false}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" asChild>
              <Link href="/dashboard">Cancel</Link>
            </Button>
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700"
              disabled={isLoading || hasRestaurant}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Restaurant"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
