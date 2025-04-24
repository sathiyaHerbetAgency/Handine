"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useRef } from "react";

interface QrCardProps {
  url: string;
  title?: string;
  size?: number;
  showDownload?: boolean;
  fileName?: string;
}

export function QrCard({
  url,
  title = "Scan to view menu",
  size = 256,
  showDownload = false,
  fileName = "menu-qr-code",
}: QrCardProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const downloadQRCode = () => {
    if (!qrCodeRef.current) return;

    const svgElement = qrCodeRef.current.querySelector("svg");
    if (!svgElement) return;

    // Create a canvas element
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions to match SVG
    canvas.width = size;
    canvas.height = size;

    // Create an image from the SVG
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();

    img.onload = () => {
      // Fill with white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the image
      ctx.drawImage(img, 0, 0);

      // Create download link
      const a = document.createElement("a");
      a.download = `${fileName}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center bg-white p-4">
        <div ref={qrCodeRef}>
          <QRCodeSVG value={url} size={size} level="M" includeMargin={true} />
        </div>
        {showDownload && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={downloadQRCode}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PNG
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
