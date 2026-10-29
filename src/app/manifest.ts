import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Clube Rango — Junqueirópolis",
    short_name: "Rango",
    description: "Comida de verdade, benefícios de casa e pedidos sem complicação.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffdf8",
    theme_color: "#173f32",
    orientation: "portrait",
    categories: ["food", "lifestyle", "shopping"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
