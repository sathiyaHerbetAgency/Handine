import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Check,
  QrCode,
  Utensils,
  Palette,
  Share2,
} from "lucide-react";

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50 opacity-70" />

      <div className="relative pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 text-center lg:text-left">
              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8 tracking-tight">
                Digital Menus with
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 block mt-2">
                  QR Code Access
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Transform your restaurant menu into an interactive digital
                experience. Create beautiful, customizable menus that customers
                can access instantly via QR codes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-8 py-4 text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors text-lg font-medium"
                >
                  Create Your Menu
                  <ArrowUpRight className="ml-2 w-5 h-5" />
                </Link>

                <Link
                  href="#pricing"
                  className="inline-flex items-center px-8 py-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-lg font-medium"
                >
                  View Pricing
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>No technical skills required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 relative">
              <div className="relative w-full max-w-md mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                  <div className="p-5 bg-orange-50 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                          <Utensils className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium">Bistro Sample Menu</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-gray-500" />
                        <Share2 className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-3">Appetizers</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Bruschetta</p>
                              <p className="text-sm text-gray-500">
                                Toasted bread with tomatoes and herbs
                              </p>
                            </div>
                            <p className="font-medium">$8.99</p>
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Calamari</p>
                              <p className="text-sm text-gray-500">
                                Crispy fried with lemon aioli
                              </p>
                            </div>
                            <p className="font-medium">$12.99</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-3">
                          Main Courses
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Grilled Salmon</p>
                              <p className="text-sm text-gray-500">
                                With seasonal vegetables
                              </p>
                            </div>
                            <p className="font-medium">$24.99</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white rounded-lg shadow-lg flex items-center justify-center p-2 transform rotate-6">
                  <div className="bg-gray-800 w-full h-full rounded flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
