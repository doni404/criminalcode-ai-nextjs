import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Criminal Code AI Assistant | Indonesian Penal Code Analysis",
  description: "Advanced AI-powered criminal law analysis assistant for Indonesian Penal Code. Get expert legal analysis, criminal code article identification, penalty calculations, and comprehensive case evaluation with interactive questioning system.",
  keywords: [
    "Indonesian criminal law",
    "penal code analysis", 
    "criminal code AI",
    "legal analysis assistant",
    "Indonesian legal system",
    "criminal case evaluation",
    "legal consultation AI",
    "criminal code articles",
    "penalty calculation",
    "legal element analysis",
    "criminal law expert",
    "Indonesian KUHP"
  ].join(", "),
  authors: [{ name: "Criminal Code AI Team" }],
  creator: "Criminal Code AI Team",
  publisher: "Criminal Code AI",
  category: "Legal Technology",
  
  // Open Graph meta tags
  openGraph: {
    title: "Criminal Code AI Assistant | Indonesian Penal Code Analysis",
    description: "Advanced AI-powered criminal law analysis for Indonesian Penal Code. Expert legal analysis, article identification, and comprehensive case evaluation.",
    type: "website",
    locale: "en_US",
    siteName: "Criminal Code AI Assistant",
  },
  
  // Twitter Card meta tags
  twitter: {
    card: "summary_large_image",
    title: "Criminal Code AI Assistant | Indonesian Penal Code Analysis",
    description: "Advanced AI-powered criminal law analysis for Indonesian Penal Code. Expert legal analysis and case evaluation.",
    creator: "@CriminalCodeAI",
  },
  
  // Additional meta tags
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Favicon and icons
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  
  // App manifest
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1e40af' },
    { media: '(prefers-color-scheme: dark)', color: '#1e293b' }
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="application-name" content="Criminal Code AI" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Criminal Code AI" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#1e40af" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Criminal Code AI Assistant",
              "description": "Advanced AI-powered criminal law analysis assistant for Indonesian Penal Code",
              "url": "https://criminalcode-ai.vercel.app",
              "applicationCategory": "LegalApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "creator": {
                "@type": "Organization",
                "name": "Criminal Code AI Team"
              }
            })
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800`}
        suppressHydrationWarning={true}
      >
        <div className="min-h-screen flex flex-col" suppressHydrationWarning>
          <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3" suppressHydrationWarning>
              <div className="flex items-center justify-between" suppressHydrationWarning>
                <div className="flex items-center space-x-3" suppressHydrationWarning>
                  <div className="p-2 bg-blue-600 rounded-lg" suppressHydrationWarning>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11h4m-4 4h6" />
                    </svg>
                  </div>
                  <div suppressHydrationWarning>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                      Criminal Code AI
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Indonesian Penal Code Analysis</p>
                  </div>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400" suppressHydrationWarning>
                  Powered by AI
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-1" suppressHydrationWarning>
            {children}
          </main>
          
          <footer className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 mt-auto">
            <div className="container mx-auto px-4 py-6" suppressHydrationWarning>
              <div className="text-center text-sm text-slate-600 dark:text-slate-400" suppressHydrationWarning>
                <p className="mb-2">
                  <strong>Legal Disclaimer:</strong> This AI assistant provides general information and analysis based on Indonesian Penal Code for educational purposes only.
                </p>
                <p>
                  This is not official legal advice. Always consult with a qualified Indonesian attorney for professional legal guidance regarding your specific situation.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
