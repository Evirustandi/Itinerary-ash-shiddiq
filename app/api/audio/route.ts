import { env } from 'cloudflare:workers';

const AUDIO_KEY = 'ambient/current';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const object = await env.MEDIA.get(AUDIO_KEY, { range: request.headers });

  if (!object) {
    return Response.redirect(new URL('/ambient-journey.wav', request.url), 307);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'no-store');
  headers.set('ETag', object.httpEtag);

  if (object.range) {
    const offset = 'offset' in object.range ? object.range.offset : 0;
    const length = 'length' in object.range ? object.range.length : object.size;
    headers.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${object.size}`);
    headers.set('Content-Length', String(length));
    return new Response(object.body, { status: 206, headers });
  }

  headers.set('Content-Length', String(object.size));
  return new Response(object.body, { headers });
}
