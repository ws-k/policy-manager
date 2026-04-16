import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { createClient } from '@/lib/supabase/server'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Policy Manager',
  description: 'DS Visitor 정책 관리 시스템',
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
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="flex h-full bg-surface-primary text-content-primary">
        <Toaster position="top-right" richColors />
        {isAuthPage ? (
          children
        ) : (
          <>
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
