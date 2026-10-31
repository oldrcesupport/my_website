import React from "react";
import { Header } from "@/components/layout/Header";
import { Hero } from "@/components/home/Hero";
import { LoungeExperience } from "@/components/home/LoungeExperience";
import { TicketPurchaseForm } from "@/components/home/TicketPurchaseForm";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FaqSection } from "@/components/home/FaqSection";
import { Footer } from "@/components/layout/Footer";
import { PublicRestaurantSettings } from "@/types";

export const dynamic = "force-dynamic";

async function getSettings(): Promise<PublicRestaurantSettings | null> {
  const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";
  try {
    const res = await fetch(`${backendUrl}/api/v1/public/settings/`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error("Failed to fetch settings from backend:", err);
    return null;
  }
}

export default async function HomePage() {
  const settings = await getSettings();

  const restaurantName = settings?.restaurant_name || "نام رستوران";
  const tagline = settings?.tagline || "تجربه موسیقی زنده در فضایی صمیمی و فاخر";
  const ticketPrice = settings?.ticket_price_toman || 100000;

  return (
    <div className="flex flex-col min-h-screen">
      <Header restaurantName={restaurantName} />
      <main className="flex-1">
        <Hero
          restaurantName={restaurantName}
          tagline={tagline}
          ticketPrice={ticketPrice}
        />
        <LoungeExperience />
        <TicketPurchaseForm settings={settings} />
        <HowItWorks />
        <FaqSection />
      </main>
      <Footer
        restaurantName={restaurantName}
        tagline={tagline}
        address={settings?.address}
        phone={settings?.phone}
      />
    </div>
  );
}
