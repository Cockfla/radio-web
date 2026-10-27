import type { APIRoute } from "astro";

export const prerender = false;

// El origen es Shoutcast v1: responde "ICY 200 OK" (no es HTTP válido) y Safari
// iOS no lo reproduce directo. Este endpoint abre el socket TCP a mano, descarta
// la cabecera ICY y reexpone el audio como una respuesta HTTP normal.
//
// Corre en Cloudflare Workers (`cloudflare:sockets`). No existe en `astro dev`
// (Node): para probarlo localmente usar `pnpm cf:preview`.
const STREAM_HOST = "15.235.64.49";
const STREAM_PORT = 8366;
const STREAM_PATH = "/;";
const CONNECT_TIMEOUT_MS = 15000;
const MAX_HEADER_BYTES = 16 * 1024;

const UPSTREAM_REQUEST = [
  `GET ${STREAM_PATH} HTTP/1.0`,
  `Host: ${STREAM_HOST}`,
  "User-Agent: GenteComunicaciones/1.0",
  "Accept: audio/aac,audio/aacp,audio/*;q=0.9,*/*;q=0.8",
  "Icy-MetaData: 0",
  "Connection: close",
  "",
  "",
].join("\r\n");

const unavailable = () => new Response("Señal no disponible", { status: 502 });

export const GET: APIRoute = async ({ locals }) => {
  let sockets: typeof import("cloudflare:sockets");
  try {
    sockets = await import("cloudflare:sockets");
  } catch {
    return new Response("Solo disponible en el runtime de Cloudflare", { status: 501 });
  }

  const socket = sockets.connect({ hostname: STREAM_HOST, port: STREAM_PORT });

  try {
    await Promise.race([
      socket.opened,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout conectando con la radio")), CONNECT_TIMEOUT_MS)
      ),
    ]);

    const writer = socket.writable.getWriter();
    await writer.write(new TextEncoder().encode(UPSTREAM_REQUEST));
    // No cerrar el writable: el origen cortaría el stream.
    writer.releaseLock();

    // Lee solo la cabecera, byte a byte (BYOB), para que el resto del audio no
    // pase por JS.
    const reader = socket.readable.getReader({ mode: "byob" });
    let head = "";
    while (!head.endsWith("\r\n\r\n")) {
      const { value, done } = await reader.read(new Uint8Array(1));
      if (done || !value) throw new Error("conexión cerrada antes de la cabecera");
      head += String.fromCharCode(value[0]);
      if (head.length > MAX_HEADER_BYTES) throw new Error("cabecera demasiado larga");
    }
    reader.releaseLock();

    const statusLine = head.split("\r\n")[0];
    if (!/^(ICY|HTTP\/1\.[01]) 200/.test(statusLine)) {
      throw new Error(`respuesta inesperada de la radio: ${statusLine}`);
    }
  } catch (error) {
    console.error("[api/radio]", error instanceof Error ? error.message : error);
    socket.close().catch(() => {});
    return unavailable();
  }

  // Tubería nativa (sin JS por cada trozo de audio). Un stream ya leído no
  // puede usarse como cuerpo de Response, por eso se pasa por un identity stream.
  const { readable, writable } = new (globalThis as any).IdentityTransformStream();
  const pipe = socket.readable.pipeTo(writable).catch(() => {});
  const ctx = (locals as { runtime?: { ctx?: { waitUntil(p: Promise<unknown>): void } } }).runtime?.ctx;
  ctx?.waitUntil(pipe);

  return new Response(readable, {
    headers: {
      "Content-Type": "audio/aac",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Accept-Ranges": "none",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
