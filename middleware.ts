import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// 🔽 قم بإدراج المسارات التي تريد حمايتها فقط
const isProtectedRoute = createRouteMatcher([
  '/', // 👈 أضف هذا السطر لحماية الصفحة الرئيسية
  '/room(.*)',
  '/game(.*)',
  '/pricing(.*)',
  '/profile(.*)'
])

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth.protect()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}