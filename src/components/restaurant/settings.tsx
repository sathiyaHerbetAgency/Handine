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
import {
  Loader2,
  Save,
  Trash,
  UploadCloud,
  Image as ImageIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./../../../supabase/client";

type Restaurant = {
  id: string;
  name: string;
  description?: string;
  banner_image?: string;
  logo_image?: string;
  primary_color?: string;
  font_family?: string;
};
type FormState = {
  name: string;
  description: string;
  bannerImage: string; // local state uses camelCase
  logoImage: string; // local state uses camelCase
  primaryColor: string;
  fontFamily: string;
};


type Props = { restaurant: Restaurant };

const BUCKET = "menu-images"; // your storage bucket

export default function RestaurantSettings({ restaurant }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: restaurant.name,
    description: restaurant.description || "",
    bannerImage: restaurant.banner_image || "",
    logoImage: restaurant.logo_image || "",
    primaryColor: restaurant.primary_color || "#f97316",
    fontFamily: restaurant.font_family || "Inter",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState<{
    banner?: boolean;
    logo?: boolean;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ⬇️ Refs to trigger native file pickers
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- Upload helpers -------------------------------------------------------
const uploadImage = async (
  file: File,
  kind: "banner" | "logo"
): Promise<string> => {
  if (!file) throw new Error("No file selected.");
  if (file.size > 5 * 1024 * 1024)
    throw new Error("Please upload images under 5MB.");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${restaurant.id}/branding/${kind}-${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;
  if (!data?.path) throw new Error("Upload failed: missing path.");

  const { data: pub, error: pubErr } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path);
  if (pubErr) throw pubErr;

  const url = pub.publicUrl;
  if (!url) throw new Error("Upload failed: no public URL returned.");
  return url;
};

// 3) onPickBanner — url is now `string`, so setState matches FormState
const onPickBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploading((u) => ({ ...u, banner: true }));
  setError(null);
  try {
    const url = await uploadImage(file, "banner"); // url: string ✅
    setFormData((p) => ({ ...p, bannerImage: url })); // matches FormState ✅
    setSuccess("Banner image uploaded. Click Save to apply.");
  } catch (err: any) {
    setError(err.message || "Failed to upload banner image");
  } finally {
    setUploading((u) => ({ ...u, banner: false }));
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  }
};

// 4) onPickLogo — same pattern
const onPickLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploading((u) => ({ ...u, logo: true }));
  setError(null);
  try {
    const url = await uploadImage(file, "logo"); // url: string ✅
    setFormData((p) => ({ ...p, logoImage: url }));
    setSuccess("Logo uploaded. Click Save to apply.");
  } catch (err: any) {
    setError(err.message || "Failed to upload logo");
  } finally {
    setUploading((u) => ({ ...u, logo: false }));
    if (logoInputRef.current) logoInputRef.current.value = "";
  }
};

  // --- Save/Delete ----------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!formData.name.trim()) throw new Error("Restaurant name is required");

      const { error } = await supabase
        .from("restaurants")
        .update({
          name: formData.name,
          description: formData.description,
          banner_image: formData.bannerImage?.trim() || null,
          logo_image: formData.logoImage?.trim() || null,
          primary_color: formData.primaryColor,
          font_family: formData.fontFamily,
        })
        .eq("id", restaurant.id);

      if (error) throw error;

      setSuccess("Restaurant settings updated successfully");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update restaurant settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this restaurant? This action cannot be undone."
      )
    )
      return;
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

            {/* Name / Description */}
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

            {/* Banner + Logo uploaders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Banner */}
              <div className="space-y-2">
                <Label>Banner Image</Label>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="aspect-[3/1] w-full overflow-hidden rounded-md bg-white grid place-items-center">
                    {formData.bannerImage ? (
                      <img
                        src={formData.bannerImage}
                        alt="Banner preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-xs text-muted-foreground">
                        <ImageIcon className="mb-1 h-6 w-6" />
                        3:1 cover image
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {/* Hidden input + ref */}
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onPickBanner}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={!!uploading.banner}
                    >
                      {uploading.banner ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="mr-2 h-4 w-4" />
                      )}
                      {uploading.banner ? "Uploading..." : "Upload"}
                    </Button>

                    <Input
                      placeholder="or paste an image URL"
                      name="bannerImage"
                      value={formData.bannerImage}
                      onChange={handleChange}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo Image</Label>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <div className="h-24 w-24 overflow-hidden rounded-md bg-white grid place-items-center">
                    {formData.logoImage ? (
                      <img
                        src={formData.logoImage}
                        alt="Logo preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-xs text-muted-foreground">
                        <ImageIcon className="mb-1 h-6 w-6" />
                        1:1 logo
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onPickLogo}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={!!uploading.logo}
                    >
                      {uploading.logo ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="mr-2 h-4 w-4" />
                      )}
                      {uploading.logo ? "Uploading..." : "Upload"}
                    </Button>

                    <Input
                      placeholder="or paste an image URL"
                      name="logoImage"
                      value={formData.logoImage}
                      onChange={handleChange}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Theme */}
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
                  style={{ fontFamily: formData.fontFamily }}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option style={{ fontFamily: "Inter" }} value="Inter">
                    Inter
                  </option>
                  <option style={{ fontFamily: "Roboto" }} value="Roboto">
                    Roboto
                  </option>
                  <option style={{ fontFamily: "Poppins" }} value="Poppins">
                    Poppins
                  </option>
                  <option
                    style={{ fontFamily: "Lexend Deca" }}
                    value="Lexend Deca"
                  >
                    Lexend Deca
                  </option>
                  <option
                    style={{ fontFamily: "Montserrat" }}
                    value="Montserrat"
                  >
                    Montserrat
                  </option>
                  <option style={{ fontFamily: "Open Sans" }} value="Open Sans">
                    Open Sans
                  </option>
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
              disabled={isLoading || uploading.banner || uploading.logo}
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
