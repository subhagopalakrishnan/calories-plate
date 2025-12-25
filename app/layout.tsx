import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Calories Plate - Food Calorie Calculator',
  description: 'Take a photo of your food and get automatic calorie calculations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

