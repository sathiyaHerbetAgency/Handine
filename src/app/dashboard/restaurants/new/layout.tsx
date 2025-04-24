import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../../../supabase/server";
import { redirect } from "next/navigation";

export default async function NewRestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <DashboardNavbar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
