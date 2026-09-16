import type { MetadataRoute } from "next";

/** Lets the app be added to a phone's home screen with its own icon and name. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finanzplaner",
    short_name: "Finanzplaner",
    description: "Persönlicher Finanzplaner",
    lang: "de",
    start_url: "/",
    display: "standalone",
    background_color: "#fdf7f4",
    theme_color: "#fdf7f4",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
