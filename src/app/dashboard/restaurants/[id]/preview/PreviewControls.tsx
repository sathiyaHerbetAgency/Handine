"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor, Copy, LinkIcon } from "lucide-react";
import Link from "next/link";

export default function PreviewControls({
  menuUrl,
  accent,
}: {
  menuUrl: string;
  accent: string;
}) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const absoluteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${menuUrl}`
      : menuUrl;
  const encoded = useMemo(() => encodeURIComponent(absoluteUrl), [absoluteUrl]);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encoded}`;

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(absoluteUrl);
  }, [absoluteUrl]);

  const frameClass = device === "mobile" ? "w-[390px] max-w-full" : "w-full";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Preview as:</span>
          <Button
            variant={device === "mobile" ? "default" : "outline"}
            size="sm"
            onClick={() => setDevice("mobile")}
            style={
              device === "mobile"
                ? { backgroundColor: accent, borderColor: accent }
                : {}
            }
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Mobile
          </Button>
          <Button
            variant={device === "desktop" ? "default" : "outline"}
            size="sm"
            onClick={() => setDevice("desktop")}
            style={
              device === "desktop"
                ? { backgroundColor: accent, borderColor: accent }
                : {}
            }
          >
            <Monitor className="h-4 w-4 mr-2" />
            Desktop
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Button asChild size="sm">
            <Link href={menuUrl} target="_blank">
              <LinkIcon className="h-4 w-4 mr-2" />
              Open Live
            </Link>
          </Button>
          <div className="hidden sm:flex items-center gap-2 rounded-md border p-2 ml-2">
            <img src={qrUrl} alt="QR" className="h-12 w-12" />
            <div className="text-xs">
              <div className="font-medium">Scan Menu</div>
              <div className="text-muted-foreground">Open on your phone</div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Frame */}
      {device === "mobile" ? (
        <div className="flex justify-center">
          <div className={frameClass}>
            <div className="border rounded-3xl overflow-hidden shadow-xl">
              <iframe
                src={menuUrl}
                className="h-[700px] w-full rounded-b-[28px] border-0"
                title="Menu preview (mobile)"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden shadow-sm">
          <iframe
            src={menuUrl}
            className="w-full h-[800px]"
            title="Menu preview (desktop)"
          />
        </div>
      )}
    </>
  );
}
