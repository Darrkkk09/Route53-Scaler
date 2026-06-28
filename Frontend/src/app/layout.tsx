import type { Metadata } from "next";
import "./globals.css";
import AwsHeader from "@/components/AwsHeader";
import AwsSidebar from "@/components/AwsSidebar";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "Amazon Route 53 Console",
  description: "A premium clone of AWS Route53 featuring hosted zone and DNS record management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#f1f3f4] text-[#16191f]">
        <Providers>
          <div className="flex flex-col min-h-screen">
            {/* Top Navigation */}
            <AwsHeader />
            
            <div className="flex flex-1 pt-[48px]">
              {/* Left Sidebar */}
              <AwsSidebar />
              
              {/* Main Content Area */}
              <main className="flex-1 pl-[220px] min-h-[calc(100vh-48px)] p-6 bg-[#f1f3f4] overflow-y-auto">
                <div className="max-w-[1400px] mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
