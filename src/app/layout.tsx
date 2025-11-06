import "./globals.css";
import Header from "@/components/Header";

export const metadata = {
  title: "Creative Production Suite",
  description: "AI-powered tools for creative production, strategy analysis, and performance marketing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
