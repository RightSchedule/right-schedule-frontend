import type { MetadataRoute } from "next";

// Install metadata for Android/Chrome home screens. Without it Android scales the 48px favicon up (blurry).
// Maskable icons are full-bleed with the glyph inside the safe zone, so launchers can apply their own shape.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RightSchedule",
    short_name: "RightSchedule",
    description: "Online booking for local businesses",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#1851db",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
