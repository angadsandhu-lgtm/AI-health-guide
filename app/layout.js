import "./globals.css";
import { Atkinson_Hyperlegible } from "next/font/google";

const font = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata = {
  title: "Health Guide, AI-powered health information",
  description: "Plain-language health information checked against ten medical sources. Not a substitute for professional care.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={font.className}>{children}</body>
    </html>
  );
}
