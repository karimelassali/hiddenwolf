import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    // استثناء ملفات static مثل الصور والـ js/css
    '/((?!_next|.*\\..*).*)',
    '/(api|trpc)(.*)',
  ],
};
