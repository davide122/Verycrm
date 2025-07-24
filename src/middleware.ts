import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Percorsi che non richiedono autenticazione
  const publicPaths = ['/login']
  const { pathname } = request.nextUrl

  // Se è un percorso pubblico, continua
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // Controlla se c'è una sede selezionata nei cookie o headers
  const currentSede = request.cookies.get('currentSede')?.value
  
  // Se non c'è una sede selezionata, reindirizza al login
  if (!currentSede && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}