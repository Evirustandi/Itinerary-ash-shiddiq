import { getItinerary, isAdminPasscode, updateEvent, updateNotice } from '@/lib/itinerary-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getItinerary();
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Unable to load itinerary', error);
    return Response.json({ message: 'Jadwal live belum dapat dimuat.' }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdminPasscode(request.headers.get('x-admin-passcode'))) {
    return Response.json({ message: 'Kode pengelola tidak sesuai.' }, { status: 401 });
  }

  try {
    const body = await request.json() as {
      kind?: 'event' | 'notice';
      id?: string;
      value?: string;
      updates?: Record<string, unknown>;
    };

    if (body.kind === 'notice') {
      await updateNotice(String(body.value ?? ''));
    } else if (body.kind === 'event' && body.id) {
      await updateEvent(body.id, body.updates ?? {});
    } else {
      return Response.json({ message: 'Permintaan pembaruan tidak lengkap.' }, { status: 400 });
    }

    return Response.json(await getItinerary());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pembaruan gagal disimpan.';
    return Response.json({ message }, { status: 400 });
  }
}
