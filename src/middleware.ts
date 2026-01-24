import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route protection

  // 1. Admin Pages Protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (request.nextUrl.pathname === '/admin/login') {
      if (user) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return response;
    }

    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // ROLE-BASED ACCESS CONTROL (RBAC)
    const role = user.user_metadata?.role || 'admin'; // Default to admin if not set
    const restrictedPaths = ['/admin/tables', '/admin/settings'];

    if (
      role === 'staff' &&
      restrictedPaths.some((path) => request.nextUrl.pathname.startsWith(path))
    ) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  // 2. API Protection
  const isApi = request.nextUrl.pathname.startsWith('/api');
  if (isApi) {
    const method = request.method;
    const path = request.nextUrl.pathname;
    const role = user?.user_metadata?.role || 'admin';
    const isWrite = ['POST', 'PUT', 'DELETE'].includes(method);

    // Allow POST /api/reservations (Public - Create new booking)
    if (path === '/api/reservations' && method === 'POST') {
      return response;
    }

    // Allow POST /api/timeslots (Public - Hold/Release slots)
    if (path === '/api/timeslots') {
      return response;
    }

    // Block everything if not logged in (other than allowed public above)
    if (isWrite && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Block Staff from sensitive write operations
    if (role === 'staff' && isWrite) {
      // Staff CAN update reservations (e.g. confirm/cancel)
      if (path.startsWith('/api/reservations') && (method === 'PUT' || method === 'POST')) {
        return response;
      }
      // Staff CANNOT edit tables or settings
      if (path.startsWith('/api/tables') || path.startsWith('/api/settings')) {
        return NextResponse.json({ error: 'Permission Denied: Admin only' }, { status: 403 });
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
