import { env } from 'cloudflare:workers';
import { isAdminPasscode } from '@/lib/itinerary-store';

const AUDIO_KEY = 'ambient/current';
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/ogg',
]);

export const dynamic = 'force-dynamic';

function unauthorized() {
  return Response.json({ message: 'Kode pengelola tidak sesuai.' }, { status: 401 });
}

export async function GET() {
  const object = await env.MEDIA.head(AUDIO_KEY);
  if (!object) {
    return Response.json({ source: 'default', filename: 'Audio ambient bawaan', contentType: 'audio/wav', size: 1234844 });
  }

  return Response.json({
    source: 'custom',
    filename: object.customMetadata?.filename || 'Audio pilihan pengelola',
    contentType: object.httpMetadata?.contentType || 'audio/mpeg',
    size: object.size,
    updatedAt: object.uploaded.toISOString(),
  });
}

export async function POST(request: Request) {
  if (!isAdminPasscode(request.headers.get('x-admin-passcode'))) return unauthorized();

  const encodedFilename = request.headers.get('x-audio-filename') || '';
  const filename = decodeURIComponent(encodedFilename).trim();
  const contentType = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const contentLength = Number(request.headers.get('content-length') || 0);
  const hasAllowedExtension = /\.(mp3|wav|m4a|ogg)$/i.test(filename);

  if (!request.body || !filename) {
    return Response.json({ message: 'Pilih berkas audio terlebih dahulu.' }, { status: 400 });
  }
  if (!ALLOWED_AUDIO_TYPES.has(contentType) && !hasAllowedExtension) {
    return Response.json({ message: 'Gunakan berkas MP3, WAV, M4A, atau OGG.' }, { status: 400 });
  }
  if (contentLength > MAX_AUDIO_BYTES) {
    return Response.json({ message: 'Ukuran audio maksimal 12 MB.' }, { status: 400 });
  }

  await env.MEDIA.put(AUDIO_KEY, request.body, {
    httpMetadata: { contentType: ALLOWED_AUDIO_TYPES.has(contentType) ? contentType : 'audio/mpeg' },
    customMetadata: { filename },
  });

  return Response.json({ message: 'Audio latar berhasil diganti.', filename });
}

export async function DELETE(request: Request) {
  if (!isAdminPasscode(request.headers.get('x-admin-passcode'))) return unauthorized();
  await env.MEDIA.delete(AUDIO_KEY);
  return Response.json({ message: 'Audio bawaan digunakan kembali.' });
}
