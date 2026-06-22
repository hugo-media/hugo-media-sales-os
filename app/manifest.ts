import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hugo Media Sales OS",
    short_name: "Hugo Sales",
    description: "Mobile CRM for Hugo Media sales, leads, follow-ups and pipeline.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#080a10",
    theme_color: "#080a10",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ],
    shortcuts: [
      {
        name: "Додати лід",
        short_name: "Новий лід",
        url: "/leads",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }]
      },
      {
        name: "Pipeline",
        short_name: "Pipeline",
        url: "/pipeline",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }]
      }
    ]
  };
}
