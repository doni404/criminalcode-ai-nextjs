import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Criminal Code AI Assistant",
  description: "AI-powered criminal case analysis and legal code identification system. Get expert analysis on applicable laws, criminal code chapters, and potential penalties.",
  keywords: "criminal law, legal analysis, AI assistant, criminal code, legal consultation",
  authors: [{ name: "Criminal Code AI Team" }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e293b',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
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
                    <p className="text-sm text-slate-600 dark:text-slate-300">Legal Analysis Assistant</p>
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
                  <strong>Disclaimer:</strong> This AI assistant provides general information only and should not be considered legal advice.
                </p>
                <p>
                  Always consult with a qualified attorney for professional legal guidance regarding your specific situation.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
