import "@/styles/globals.css";
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "SpendWise",
  description: "Mobile-first expense tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
          integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          integrity="sha512-Sf0A6QDBoEoCZbk+kRf6sS4L39Rh4UWZmj+YFs5Lx2LmFZZ2sMMEZe2qTfye3GQ8ffNkueDJ7u84+87xPV0u2g=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <link
          href="https://fonts.googleapis.com/css?family=Nunito:200,200i,300,300i,400,400i,600,600i,700,700i,800,800i,900,900i"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/css/sb-admin-2.min.css" />
      </head>
      <body className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        {children}
        <Script
          src="https://code.jquery.com/jquery-3.7.1.min.js"
          integrity="sha256-+eRQz7JmlE/hN5C2p2iVJYUU9IW3ItZJo+7VWlM0YhA="
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Script src="/js/sb-admin-2.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
