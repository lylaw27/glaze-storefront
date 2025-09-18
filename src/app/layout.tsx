import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"
import CartProvider from "./cartProvider"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout({children}:{ children: React.ReactNode }) {


  return (
    <html lang="en" data-mode="light">
      <body>
        <CartProvider>
          <main className="relative">
              {children}
          </main>
        </CartProvider>
      </body>
    </html>
  )
}
