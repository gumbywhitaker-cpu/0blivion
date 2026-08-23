import type { MetadataRoute } from "next";

// Makes KiwiFlow installable as an app on Windows, macOS, Android, and
// (via Safari's "Add to Home Screen", which reads this too) iOS — no app
// store, no code signing. "/" already role-routes a logged-in visitor
// straight to /dashboard, so it's the right start_url for an app icon too.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KiwiFlow",
    short_name: "KiwiFlow",
    description:
      "The operational layer for New Zealand kiwifruit — growers, contractors, crews, transport and pack houses in one shared record.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#0f2e1d",
    theme_color: "#16532f",
    orientation: "any",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
