import { defineMiddleware } from "astro:middleware";

// Rutas que solo piden bots de escaneo (archivos ocultos, paneles de debug,
// WordPress, PHP). Se responde 404 sin renderizar la página ni llamar a las
// APIs externas (NewsAPI, OpenWeather).
const PROBE_PATHS =
  /^\/(\.(?!well-known(?:\/|$))[^/]+|debug|actuator|phpmyadmin|wp-[^/]+|xmlrpc\.php|vendor|cgi-bin|server-status)(\/|$)|\.(php|asp|aspx|jsp|env|sql|bak|zip|tar|gz)$/i;

export const onRequest = defineMiddleware((context, next) => {
  const { pathname } = new URL(context.request.url);
  if (PROBE_PATHS.test(pathname)) {
    return new Response("Not found", { status: 404 });
  }
  return next();
});
