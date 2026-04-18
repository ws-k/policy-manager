import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { createClient } from '@/lib/supabase/server'
import { Toaster } from 'sonner'
import { SearchModal } from '@/components/search/SearchModal'
import './globals.css'

export const metadata: Metadata = {
  title: 'Poli',
  description: 'Poli',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/set-password') || pathname.startsWith('/public-view')

  let userEmail: string | undefined
  if (!isAuthPage) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userEmail = user?.email ?? undefined
    } catch {
      // middleware handles redirect
    }
  }

  return (
    <html lang="ko" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&display=swap" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="preload"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        {/* Non-blocking font load: switched to all after load */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
          media="print"
          id="pretendard-css"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var l=document.getElementById('pretendard-css');if(l)l.media='all'})()`,
          }}
        />
      </head>
      <body className="flex h-full bg-surface-primary text-content-primary">
        <Toaster position="top-right" richColors />
        {isAuthPage ? (
          children
        ) : (
          <>
            <SearchModal />
            <Sidebar />
            <div className="flex flex-1 flex-col min-h-0">
              <TopBar userEmail={userEmail} />
              <main className="flex-1 overflow-auto p-6">{children}</main>
            </div>
          </>
        )}
      </body>
    </html>
  )
}
