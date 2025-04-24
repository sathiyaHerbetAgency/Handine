import Link from "next/link";
import { createClient } from "../../supabase/server";
import { Button } from "./ui/button";
import { User, UserCircle, QrCode, Menu } from "lucide-react";
import UserProfile from "./user-profile";

export default async function Navbar() {
  const supabase = createClient();

  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" prefetch className="text-xl font-bold flex items-center">
          <QrCode className="w-6 h-6 mr-2 text-orange-600" />
          <span className="font-bold text-gray-900">
            Menu<span className="text-orange-600">QR</span>
          </span>
        </Link>

        <div className="hidden md:flex space-x-6">
          <Link
            href="/#features"
            className="text-gray-600 hover:text-orange-600 font-medium"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-gray-600 hover:text-orange-600 font-medium"
          >
            How It Works
          </Link>
          <Link
            href="/#pricing"
            className="text-gray-600 hover:text-orange-600 font-medium"
          >
            Pricing
          </Link>
        </div>

        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <Link href="/dashboard" className="px-4 py-2 text-sm font-medium">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  Dashboard
                </Button>
              </Link>
              <UserProfile />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
