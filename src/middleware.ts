import { defineMiddleware } from "astro:middleware";

// Rutas que solo piden bots de escaneo (archivos ocultos, paneles de debug,
// WordPress, PHP). Se responde 404 sin renderizar la página ni llamar a las
// APIs externas (NewsAPI, OpenWeather).
const PROBE_PATHS =
  /^\/(\.(?!well-known(?:\/|$))[^/]+|debug|actuator|phpmyadmin|wp-[^/]+|xmlrpc\.php|vendor|cgi-bin|server-status)(\/|$)|\.(php|asp|aspx|jsp|env|sql|bak|zip|tar|gz)$/i;

// La CSP solo restringe lo que no afecta al sitio (iframes, <base>, <object>,
// formularios); no limita scripts, imágenes, mapas ni audio. Los archivos
// estáticos reciben las mismas cabeceras desde public/_headers.
const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy":
    "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

const withSecurityHeaders = (response: Response) => {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = new URL(context.request.url);
  if (PROBE_PATHS.test(pathname)) {
    return withSecurityHeaders(new Response("Not found", { status: 404 }));
  }
  // El stream de audio se deja pasar tal cual (sin reenvolver el body).
  if (pathname === "/api/radio") return next();
  return withSecurityHeaders(await next());
});
