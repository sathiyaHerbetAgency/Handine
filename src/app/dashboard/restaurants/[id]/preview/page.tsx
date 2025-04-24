import { createClient } from "../../../../../../supabase/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function PreviewPage({
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

  return (
    <div className="container mx-auto px-4 py-8">
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

        <Button asChild className="bg-orange-600 hover:bg-orange-700">
          <Link href={`/menu/${params.id}`} target="_blank">
            Open in New Tab
          </Link>
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden shadow-sm h-[800px]">
        <iframe
          src={`/menu/${params.id}`}
          className="w-full h-full"
          title={`${restaurant.name} Menu Preview`}
        />
      </div>
    </div>
  );
}
