"use client";

import { useState } from "react";

export default function OpenPortalButton({
  customerId,
  returnUrl = "/dashboard",
  className = "",
  children,
}: {
  customerId: string;
  returnUrl?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId, return_url: returnUrl }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={openPortal} className={className} disabled={loading}>
      {loading ? "Opening..." : children}
    </button>
  );
}
