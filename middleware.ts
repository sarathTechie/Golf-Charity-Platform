import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value; },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options } as never);
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options } as never);
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options } as never);
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: '', ...options } as never);
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users away from protected routes
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Admin-only guard
  if (pathname.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin')
      return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
