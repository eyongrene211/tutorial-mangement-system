import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse }           from 'next/server';

/**
 * PUBLIC ROUTES
 */
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook(.*)',
  '/api/seed(.*)',
  '/api/create-users(.*)',
]);

/**
 * COMBINED MIDDLEWARE
 */
export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl;
  
  // Skip for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    if (!isPublicRoute(request) && pathname.startsWith('/api')) {
      await auth.protect();
    }
    return NextResponse.next();
  }
  
  // Check authentication for protected routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
  
  return NextResponse.next();
});

/**
 * MATCHER CONFIG
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
