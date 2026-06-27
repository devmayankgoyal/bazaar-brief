import "./globals.css";

export const metadata = {
  title: "Bazaar Brief — Business & finance headlines, summarized",
  description:
    "AI-summarized business and finance headlines. Summaries are generated automatically and link back to the original reporting.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@500&family=Inter:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
