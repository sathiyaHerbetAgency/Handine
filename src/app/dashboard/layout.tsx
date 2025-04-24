import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import { headers } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || "";
  const isNewRestaurantPage = pathname.includes("/dashboard/restaurants/new");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Skip subscription check for the new restaurant page
  if (isNewRestaurantPage) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <DashboardNavbar />
        <div className="flex-1">{children}</div>
      </div>
    );
  }

  return (
    <SubscriptionCheck>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <DashboardNavbar />
        <div className="flex-1">{children}</div>
      </div>
    </SubscriptionCheck>
  );
}
