import type { APIRoute } from "astro";
import { ImageResponse } from "@vercel/og";

export const prerender = false;

async function loadGoogleFont(font: string, weight: number, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await fetch(url).then((res) => res.text());
  const match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/);
  if (!match || !match[1]) throw new Error("Font not found");
  const fontUrl = match[1];
  return fetch(fontUrl).then((res) => res.arrayBuffer());
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const title = url.searchParams.get("title") || "Shreyas Londhe";
  const isHome = title === "Shreyas Londhe";

  const displayText = isHome ? title : title;
  const allText = isHome
    ? `${title}Applied Cryptography Engineer`
    : title;

  const interSemibold = await loadGoogleFont("Inter", 600, allText);
  const interRegular = await loadGoogleFont("Inter", 400, allText);

  return new ImageResponse(
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#fafafa",
          padding: "60px",
          justifyContent: "flex-end",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: isHome ? "12px" : "0px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: isHome ? 72 : 64,
                      fontFamily: "Inter",
                      fontWeight: 600,
                      color: "#171717",
                      letterSpacing: "-0.04em",
                      lineHeight: 1.1,
                    },
                    children: displayText,
                  },
                },
                ...(isHome
                  ? [
                      {
                        type: "div",
                        props: {
                          style: {
                            fontSize: 32,
                            fontFamily: "Inter",
                            fontWeight: 400,
                            color: "#737373",
                            letterSpacing: "-0.02em",
                          },
                          children: "Applied Cryptography Engineer",
                        },
                      },
                    ]
                  : []),
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: interSemibold,
          style: "normal",
          weight: 600,
        },
        {
          name: "Inter",
          data: interRegular,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
};
