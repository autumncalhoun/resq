import { updateSession } from "@/lib/supabase/middleware"
 import type { NextRequest } from "next/server"

 export async function middleware(request: NextRequest) {
   return await updateSession(request)
 }

 export const config = {
   matcher: [
     "/((?!page.*.(?:svg|png|jpg|jpeg|gif|webp|tsx)$).*)",
   ],
 }

// Middleware disabled for demo mode - no authentication required
// export {}
