# Gente Comunicaciones

![Gente Comunicaciones Logo](/public/logo-blanco.png)

## Descripción

**Gente Comunicaciones** es un medio de comunicación con más de 20 años de trayectoria, enfocado en informar y entretener a la comunidad de la región de O'Higgins, Chile. A través de nuestra página web, extendemos nuestro alcance en radio y medios digitales para mantener a nuestra audiencia al día con las noticias locales, programas radiales y contenido de interés regional.

## Características

- **Noticias en tiempo real:** Mantén a la comunidad informada sobre los eventos más importantes en la región de O'Higgins, Chile y el Mundo.
- **Transmisión en vivo:** Escucha nuestra señal de radio en línea desde cualquier dispositivo.
- **Programación radial:** Consulta la programación diaria y los horarios de tus programas favoritos.

## Despliegue en Cloudflare Workers

El sitio usa Astro (SSR) con `@astrojs/cloudflare`. La configuración está en `wrangler.jsonc`.

En **Workers Builds** (Settings → Build) usar:

- Build command: `pnpm run build`
- Deploy command: `npx wrangler deploy`

> No usar `pnpm --filter ...`: `pnpm-workspace.yaml` hace que la raíz sea el workspace root y `--filter` no la incluye ("No projects matched").

Variables y secretos (Settings → Variables and Secrets): `NEWS_API_KEY` y `OPENWEATHER_API_KEY` (opcionales; sin ellas se omiten noticias y clima).

Probar en local con el runtime real de Workers (necesario para `/api/radio`, que usa `cloudflare:sockets`):

```bash
pnpm cf:preview   # astro build && wrangler dev
```

Para pasar claves en local, crear `.dev.vars` (ignorado por git) con `NEWS_API_KEY=...` y `OPENWEATHER_API_KEY=...`.