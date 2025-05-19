import "./globals.css";
import { Public_Sans } from "next/font/google";
import { Toaster } from "@/components/toaster";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import Link from "next/link";

const publicSans = Public_Sans({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Slate - YC Network Demo</title>
        <link rel="shortcut icon" href="/images/favicon.ico" />
      </head>
      <body className={publicSans.className}>
        <NuqsAdapter>
          <div className="bg-secondary grid grid-rows-[auto,1fr] h-[100dvh]">
            <div className="grid grid-cols-[1fr,auto] gap-2 p-4">
              <div className="flex items-center">
                <Link
                  href="/"
                  className="flex items-center gap-2"
                >
                  <span className="font-semibold ml-2">Slate</span>
                </Link>
              </div>
            </div>
            <div className="bg-background mx-4 relative grid rounded-t-2xl border border-input border-b-0">
              <div className="absolute inset-0">{children}</div>
            </div>
          </div>
          <Toaster />
        </NuqsAdapter>
      </body>
    </html>
  );
}
