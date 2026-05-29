import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Udumalpet Business Tour (UBT) | Discover Trusted Local Businesses",
  description: "A trusted local platform to discover, connect and grow with verified businesses in and around Udumalpet, Tamil Nadu. Browse hotels, shops, services, and more.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800 antialiased">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
