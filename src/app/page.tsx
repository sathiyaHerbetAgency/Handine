import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import Footer from "@/components/footer";
import { createClient } from "../../supabase/server";
import {
  ArrowUpRight,
  CheckCircle2,
  QrCode,
  Smartphone,
  Palette,
  Utensils,
  Clock,
  BarChart,
} from "lucide-react";
import Image from "next/image";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: plans, error } = await supabase.functions.invoke(
    "supabase-functions-get-plans",
  );
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Create and manage your restaurant's digital menu in three simple
              steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Palette className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                1. Design Your Menu
              </h3>
              <p className="text-gray-600">
                Customize your menu with our intuitive drag-and-drop builder.
                Add sections, items, descriptions, and prices.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <QrCode className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                2. Generate QR Code
              </h3>
              <p className="text-gray-600">
                Create a unique QR code that links directly to your digital
                menu. Download and print for your tables.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Smartphone className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                3. Customers Scan & Order
              </h3>
              <p className="text-gray-600">
                Customers scan the QR code with their phones to instantly view
                your beautiful digital menu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to create and manage professional digital
              menus
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Palette className="w-6 h-6" />,
                title: "Customizable Design",
                description:
                  "Personalize colors, fonts, and layouts to match your brand",
              },
              {
                icon: <QrCode className="w-6 h-6" />,
                title: "Instant QR Access",
                description:
                  "Generate unique QR codes for each menu or location",
              },
              {
                icon: <Utensils className="w-6 h-6" />,
                title: "Menu Categories",
                description:
                  "Organize items into appetizers, mains, desserts, and more",
              },
              {
                icon: <Smartphone className="w-6 h-6" />,
                title: "Mobile Optimized",
                description: "Perfect viewing experience on any device",
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Real-time Updates",
                description:
                  "Change prices or items instantly across all menus",
              },
              {
                icon: <BarChart className="w-6 h-6" />,
                title: "Menu Analytics",
                description:
                  "Track views and popular items to optimize your offerings",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-orange-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Restaurant Showcase */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Trusted by Restaurants Everywhere
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join hundreds of restaurants already using our digital menu
              solution
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-48 bg-gray-200 relative">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <span>Restaurant Image</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Bistro Italiano</h3>
                <p className="text-gray-600 mb-4">
                  "Our customers love being able to browse our full menu with
                  photos. Orders have increased by 15% since implementing the QR
                  menu system."
                </p>
                <p className="text-sm text-gray-500 font-medium">
                  - Marco, Owner
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-48 bg-gray-200 relative">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <span>Restaurant Image</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Coastal Seafood</h3>
                <p className="text-gray-600 mb-4">
                  "Updating our seasonal menu is now effortless. We can make
                  changes in real-time without having to reprint anything."
                </p>
                <p className="text-sm text-gray-500 font-medium">
                  - Sarah, Manager
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-48 bg-gray-200 relative">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <span>Restaurant Image</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Urban Grill</h3>
                <p className="text-gray-600 mb-4">
                  "The analytics feature helps us understand which menu items
                  are most viewed, allowing us to optimize our offerings."
                </p>
                <p className="text-sm text-gray-500 font-medium">
                  - David, Chef
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-orange-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-orange-100">Restaurants</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <div className="text-orange-100">Menu Views Daily</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">15%</div>
              <div className="text-orange-100">Average Order Increase</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan for your restaurant. No hidden fees.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans?.map((item: any) => (
              <PricingCard key={item.id} item={item} user={user} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Digitize Your Menu?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join hundreds of restaurants already enhancing their customer
            experience with digital menus.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Create Your Menu Now
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
