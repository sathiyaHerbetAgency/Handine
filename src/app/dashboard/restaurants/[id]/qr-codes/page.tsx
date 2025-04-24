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
import {
  ArrowLeft,
  Download,
  Loader2,
  PlusCircle,
  QrCode,
  Share2,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { QrCard } from "@/components/QrCard";
import { createClientBrowser } from "../../../../../../supabase/client";
import { useRouter } from "next/navigation";

type QRCode = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  access_url: string;
  created_at: string;
};

export default function QRCodesPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newQrCode, setNewQrCode] = useState({
    name: "",
    description: "",
  });
  const supabase = createClientBrowser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check authentication
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push(
            "/sign-in?redirect=/dashboard/restaurants/" +
              params.id +
              "/qr-codes",
          );
          return;
        }

        // Fetch restaurant data
        const { data: restaurantData, error: restaurantError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", params.id)
          .eq("user_id", user.id)
          .single();

        if (restaurantError || !restaurantData) {
          throw new Error("Restaurant not found");
        }

        setRestaurant(restaurantData);

        // Fetch QR codes
        const { data: qrCodesData, error: qrCodesError } = await supabase
          .from("qr_codes")
          .select("*")
          .eq("restaurant_id", params.id);

        if (qrCodesError) throw qrCodesError;

        setQrCodes(qrCodesData || []);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  const handleCreateQrCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      if (!newQrCode.name.trim()) {
        throw new Error("QR code name is required");
      }

      // Generate a unique access URL
      // Create a public URL that doesn't require login
      const accessUrl = `${window.location.origin}/menu/${params.id}`;

      const { data, error } = await supabase
        .from("qr_codes")
        .insert({
          restaurant_id: params.id,
          name: newQrCode.name,
          description: newQrCode.description,
          access_url: accessUrl,
        })
        .select()
        .single();

      if (error) throw error;

      setQrCodes([...qrCodes, data]);
      setNewQrCode({ name: "", description: "" });
    } catch (err: any) {
      console.error("Error creating QR code:", err);
      setError(err.message || "Failed to create QR code");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteQrCode = async (id: string) => {
    if (!confirm("Are you sure you want to delete this QR code?")) {
      return;
    }

    try {
      const { error } = await supabase.from("qr_codes").delete().eq("id", id);

      if (error) throw error;

      setQrCodes(qrCodes.filter((qr) => qr.id !== id));
    } catch (err: any) {
      console.error("Error deleting QR code:", err);
      setError(err.message || "Failed to delete QR code");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error && !restaurant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>
        <Button variant="ghost" asChild className="mt-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-2">
          <Link href={`/dashboard/restaurants/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Restaurant
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{restaurant?.name} - QR Codes</h1>
        <p className="text-muted-foreground mt-1">
          Create and manage QR codes for your digital menu
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-6">
          {error}
        </div>
      )}

      {/* Create New QR Code */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create New QR Code</CardTitle>
          <CardDescription>
            Generate a unique QR code that links to your digital menu
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateQrCode}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">QR Code Name *</Label>
              <Input
                id="name"
                value={newQrCode.name}
                onChange={(e) =>
                  setNewQrCode({ ...newQrCode, name: e.target.value })
                }
                placeholder="e.g. Table 1, Bar Area, Patio"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={newQrCode.description}
                onChange={(e) =>
                  setNewQrCode({ ...newQrCode, description: e.target.value })
                }
                placeholder="Additional details about this QR code"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Generate QR Code
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* QR Codes List */}
      <h2 className="text-xl font-semibold mb-4">Your QR Codes</h2>
      {qrCodes.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No QR Codes Yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Create your first QR code to share your digital menu
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrCodes.map((qrCode) => (
            <Card key={qrCode.id}>
              <CardHeader>
                <CardTitle className="text-lg">{qrCode.name}</CardTitle>
                {qrCode.description && (
                  <CardDescription>{qrCode.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="bg-white p-4 rounded-lg shadow-sm w-full">
                  <QrCard
                    url={qrCode.access_url}
                    size={128}
                    showDownload={true}
                    fileName={`menu-qr-${qrCode.name.toLowerCase().replace(/\s+/g, "-")}`}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Open the menu URL in a new tab
                    window.open(qrCode.access_url, "_blank");
                  }}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  View Menu
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteQrCode(qrCode.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
