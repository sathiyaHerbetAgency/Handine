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
import { Loader2, Save, Trash } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from './../../../supabase/client';

type Restaurant = {
  id: string;
  name: string;
  description?: string;
  banner_image?: string;
  logo_image?: string;
  primary_color?: string;
  font_family?: string;
};

type Props = {
  restaurant: Restaurant;
};

export default function RestaurantSettings({ restaurant }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: restaurant.name,
    description: restaurant.description || "",
    bannerImage: restaurant.banner_image || "",
    logoImage: restaurant.logo_image || "",
    primaryColor: restaurant.primary_color || "#f97316",
    fontFamily: restaurant.font_family || "Inter",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
const supabase=createClient()
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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
    setSuccess(null);

    try {
      if (!formData.name.trim()) {
        throw new Error("Restaurant name is required");
      }

      // Ensure we're sending valid URLs for images
      const bannerImage = formData.bannerImage?.trim() || null;
      const logoImage = formData.logoImage?.trim() || null;

      const { error } = await supabase
        .from("restaurants")
        .update({
          name: formData.name,
          description: formData.description,
          banner_image: bannerImage,
          logo_image: logoImage,
          primary_color: formData.primaryColor,
          font_family: formData.fontFamily,
        })
        .eq("id", restaurant.id);

      if (error) throw error;

      setSuccess("Restaurant settings updated successfully");
      router.refresh();
    } catch (err: any) {
      console.error("Error updating restaurant:", err);
      setError(err.message || "Failed to update restaurant settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this restaurant? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("restaurants")
        .delete()
        .eq("id", restaurant.id);

      if (error) throw error;

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Error deleting restaurant:", err);
      setError(err.message || "Failed to delete restaurant");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Restaurant Settings</CardTitle>
            <CardDescription>
              Update your restaurant profile and appearance settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Restaurant Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bannerImage">Banner Image URL</Label>
                <Input
                  id="bannerImage"
                  name="bannerImage"
                  value={formData.bannerImage}
                  onChange={handleChange}
                  placeholder="https://example.com/banner.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoImage">Logo Image URL</Label>
                <Input
                  id="logoImage"
                  name="logoImage"
                  value={formData.logoImage}
                  onChange={handleChange}
                  placeholder="https://example.com/logo.jpg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  />
                  <Input
                    type="text"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    name="primaryColor"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <select
                  id="fontFamily"
                  name="fontFamily"
                  value={formData.fontFamily}
                  style={{fontFamily:formData.fontFamily}}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option  style={{fontFamily:"Inter"}} className="font-family-[Inter]" value="Inter">Inter</option>
                  <option  style={{fontFamily:"Roboto"}} className="font-family-[Roboto]" value="Roboto">Roboto</option>
                  <option style={{fontFamily:"Poppins"}}  className="font-family-[Poppins]" value="Poppins">Poppins</option>
                  <option  style={{fontFamily:"LexendaDeca"}} className="font-family-[LexendaDeca]" value="LexendaDeca">LexendaDeca</option>
                  <option style={{fontFamily:"Montserrat"}} className="font-family-[Montserrat]" value="Montserrat">Montserrat</option>
                  <option style={{fontFamily:"Open Sans"}}  className="font-family-[Open Sans]" value="Open Sans">Open Sans</option>
                </select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              disabled={isLoading}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete Restaurant
            </Button>
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
