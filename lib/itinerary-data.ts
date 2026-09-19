export type EventStatus = 'scheduled' | 'now' | 'done' | 'changed';

export type ItineraryEvent = {
  id: string;
  dayNumber: number;
  time: string;
  title: string;
  details: string;
  location: string;
  status: EventStatus;
  statusNote: string;
  sortOrder: number;
  updatedAt: string;
};

export type ItineraryDay = {
  dayNumber: number;
  date: string;
  weekday: string;
  title: string;
  city: string;
  events: ItineraryEvent[];
};

export type TripSupport = {
  tourLeader: { name: string; phone: string };
  mutawwif: { name: string; phone: string };
  hotels: {
    makkah: { name: string; address: string };
    madinah: { name: string; address: string };
  };
};

export type ItineraryPayload = {
  tripSlug: string;
  tripName: string;
  dateRange: string;
  departureAt: string;
  tripEndAt: string;
  departureLabel: string;
  theme: 'emerald' | 'indigo';
  highlights?: string[];
  timezoneNote: string;
  notice: string;
  updatedAt: string;
  support: TripSupport;
  days: ItineraryDay[];
  flights: Array<{ date: string; flight: string; route: string; time: string }>;
};

const makeEvent = (
  dayNumber: number,
  sortOrder: number,
  time: string,
  title: string,
  details = '',
  location = '',
): ItineraryEvent => ({
  id: `d${dayNumber}-e${sortOrder}`,
  dayNumber,
  time,
  title,
  details,
  location,
  status: 'scheduled',
  statusNote: '',
  sortOrder,
  updatedAt: '2026-08-30T00:00:00.000Z',
});

export const itinerarySeed: ItineraryPayload = {
  tripSlug: '27-september-2026',
  tripName: 'Umrah 12 Hari Ash‑Shiddiq',
  dateRange: '27 September–9 Oktober 2026',
  departureAt: '2026-09-27T13:00:00+07:00',
  tripEndAt: '2026-10-09T23:59:59+03:00',
  departureLabel: 'Ahad, 27 September 2026',
  theme: 'emerald',
  timezoneNote: 'Seluruh waktu mengikuti waktu setempat.',
  notice: 'Program dapat berubah mengikuti kondisi di lapangan. Pantau halaman ini untuk pembaruan terbaru.',
  updatedAt: '2026-08-30T00:00:00.000Z',
  support: {
    tourLeader: { name: '', phone: '' },
    mutawwif: { name: '', phone: '' },
    hotels: {
      makkah: { name: '', address: '' },
      madinah: { name: '', address: '' },
    },
  },
  flights: [
    { date: '27 Sep 2026', flight: 'EK357G · EK801G', route: 'CGK → DXB → JED', time: '17.40 · 22.30 · 00.10 · 02.05' },
    { date: '8–9 Okt 2026', flight: 'EK810G · EK356G', route: 'MED → DXB → CGK', time: '17.35 · 21.15 · 04.05 · 15.40' },
  ],
  days: [
    {
      dayNumber: 1, date: '2026-09-27', weekday: 'Ahad', title: 'Jakarta → Dubai → Jeddah', city: 'Jakarta',
      events: [
        makeEvent(1, 1, '13.00', 'Berkumpul di Bandara Soekarno–Hatta', 'Technical meeting dan persiapan keberangkatan, lima jam sebelum penerbangan.', 'Terminal 2F'),
        makeEvent(1, 2, '17.40', 'Terbang menuju Dubai', 'Penerbangan Emirates menuju Dubai dan dilanjutkan ke Jeddah.', 'Soekarno–Hatta'),
        makeEvent(1, 3, '22.30', 'Tiba di Dubai', 'Transit dan persiapan penerbangan menuju Jeddah.', 'Dubai International Airport'),
        makeEvent(1, 4, '00.10', 'Terbang menuju Jeddah', 'Penerbangan lanjutan Emirates.', 'Dubai International Airport'),
        makeEvent(1, 5, '02.05', 'Tiba di Jeddah', 'Setelah proses kedatangan, rombongan menuju hotel di Makkah.', 'Bandara King Abdul Aziz'),
      ],
    },
    {
      dayNumber: 2, date: '2026-09-28', weekday: 'Senin', title: 'Makkah · Umrah Pertama', city: 'Makkah',
      events: [
        makeEvent(2, 1, '04.00', 'Shalat Subuh dan Umrah pertama', 'Berjalan ke Masjidil Haram lalu melaksanakan thawaf, sa’i, dan tahallul.', 'Masjidil Haram'),
        makeEvent(2, 2, '07.30', 'Sarapan dan istirahat', 'Kembali ke hotel setelah umrah.', 'Hotel Makkah'),
        makeEvent(2, 3, '12.00', 'Shalat Zuhur berjamaah', '', 'Masjidil Haram'),
        makeEvent(2, 4, '15.00', 'Shalat Asar dan Free Program', '', 'Masjidil Haram'),
        makeEvent(2, 5, '16.00', 'Ziarah sekitar Masjidil Haram', 'Maulid Nabi, Sumur Zamzam, Masjid Jin, Jannatul Mu’alla, dan sekitarnya.', 'Makkah'),
        makeEvent(2, 6, '18.00', 'Shalat Magrib dan Isya berjamaah', '', 'Masjidil Haram'),
        makeEvent(2, 7, '20.00', 'Makan malam dan istirahat', '', 'Hotel Makkah'),
      ],
    },
    {
      dayNumber: 3, date: '2026-09-29', weekday: 'Selasa', title: 'City Tour Jiranah · Umrah Kedua', city: 'Makkah',
      events: [
        makeEvent(3, 1, '04.00', 'Shalat Subuh berjamaah', '', 'Masjidil Haram'),
        makeEvent(3, 2, '06.00', 'Sarapan dan berkumpul di lobi', '', 'Hotel Makkah'),
        makeEvent(3, 3, '07.30', 'City tour Makkah dan miqat Jiranah', 'Jabal Tsur, Arafah, Jabal Rahmah, Muzdalifah, Masjid Namirah, Mina, Jamarat, dan Jabal Nur.', 'Makkah · Jiranah'),
        makeEvent(3, 4, '12.00', 'Makan siang, Zuhur, dan Umrah kedua', 'Dilanjutkan thawaf, sa’i, dan tahallul.', 'Masjidil Haram'),
        makeEvent(3, 5, '15.00', 'Shalat Asar dan Free Program', '', 'Masjidil Haram'),
        makeEvent(3, 6, '18.00', 'Shalat Magrib dan Isya', '', 'Masjidil Haram'),
        makeEvent(3, 7, '20.00', 'Makan malam dan istirahat', 'Free Program menyesuaikan program travel.', 'Hotel Makkah'),
      ],
    },
    {
      dayNumber: 4, date: '2026-09-30', weekday: 'Rabu', title: 'Makkah · Free Program', city: 'Makkah',
      events: [
        makeEvent(4, 1, '04.00', 'Shalat Subuh berjamaah', '', 'Masjidil Haram'),
        makeEvent(4, 2, '06.00', 'Sarapan dan istirahat', '', 'Hotel Makkah'),
        makeEvent(4, 3, '12.00', 'Shalat Zuhur berjamaah', '', 'Masjidil Haram'),
        makeEvent(4, 4, '15.00', 'Shalat Asar dan Free Program', '', 'Masjidil Haram'),
        makeEvent(4, 5, '18.00', 'Shalat Magrib dan Isya', '', 'Masjidil Haram'),
        makeEvent(4, 6, '20.00', 'Makan malam dan istirahat', '', 'Hotel Makkah'),
      ],
    },
    {
      dayNumber: 5, date: '2026-10-01', weekday: 'Kamis', title: 'City Tour Thaif · Umrah Ketiga', city: 'Thaif',
      events: [
        makeEvent(5, 1, '04.00', 'Tahajud dan Shalat Subuh', '', 'Masjidil Haram'),
        makeEvent(5, 2, '06.00', 'Sarapan', '', 'Hotel Makkah'),
        makeEvent(5, 3, '07.30', 'Berangkat menuju Thaif', 'Berkumpul di lobi hotel.', 'Hotel Makkah'),
        makeEvent(5, 4, '12.00', 'City tour Thaif dan miqat', 'Kereta gantung, pabrik parfum, Masjid Khu’, Masjid Addas, Masjid Abdullah bin Abbas, lalu miqat di Qarnul Manazil.', 'Thaif'),
        makeEvent(5, 5, '15.00', 'Kembali dan persiapan Umrah ketiga', '', 'Makkah'),
        makeEvent(5, 6, '18.00', 'Umrah ketiga', 'Thawaf, sa’i, dan tahallul.', 'Masjidil Haram'),
        makeEvent(5, 7, '20.00', 'Makan malam dan istirahat', '', 'Hotel Makkah'),
      ],
    },
    {
      dayNumber: 6, date: '2026-10-02', weekday: 'Jumat', title: 'Makkah · Free Program', city: 'Makkah',
      events: [
        makeEvent(6, 1, '04.00', 'Shalat Subuh berjamaah', '', 'Masjidil Haram'),
        makeEvent(6, 2, '06.00', 'Sarapan dan istirahat', '', 'Hotel Makkah'),
        makeEvent(6, 3, '11.00', 'Shalat Jumat berjamaah', '', 'Masjidil Haram'),
        makeEvent(6, 4, '15.00', 'Shalat Asar dan Free Program', '', 'Masjidil Haram'),
        makeEvent(6, 5, '18.00', 'Shalat Magrib dan Isya', '', 'Masjidil Haram'),
        makeEvent(6, 6, '20.00', 'Makan malam dan persiapan koper', 'Persiapan check-out menuju Madinah esok hari.', 'Hotel Makkah'),
      ],
    },
    {
      dayNumber: 7, date: '2026-10-03', weekday: 'Sabtu', title: 'Makkah → Madinah', city: 'Perjalanan',
      events: [
        makeEvent(7, 1, '04.00', 'Shalat Subuh dan Thawaf Wada', '', 'Masjidil Haram'),
        makeEvent(7, 2, '06.00', 'Sarapan', '', 'Hotel Makkah'),
        makeEvent(7, 3, '12.00', 'Shalat Zuhur dan makan siang', '', 'Makkah'),
        makeEvent(7, 4, '14.00', 'Check-out menuju Madinah', '', 'Hotel Makkah'),
        makeEvent(7, 5, '15.00', 'Kunjungan Museum Al‑Amoudy', '', 'Perjalanan'),
        makeEvent(7, 6, '16.00', 'Ziarah Badr', 'Masjid Arisy, Jabal Malaikat, Syuhada Badr, dan Bir Rauha.', 'Badr'),
        makeEvent(7, 7, '21.00', 'Tiba di Madinah', 'Makan malam, pembagian kunci kamar, dan ziarah pertama ke Masjid Nabawi.', 'Madinah'),
        makeEvent(7, 8, '22.00', 'Istirahat', '', 'Hotel Madinah'),
      ],
    },
    {
      dayNumber: 8, date: '2026-10-04', weekday: 'Ahad', title: 'Madinah · Ziarah Dalam', city: 'Madinah',
      events: [
        makeEvent(8, 1, '04.00', 'Tahajud dan Shalat Subuh', '', 'Masjid Nabawi'),
        makeEvent(8, 2, '06.00', 'Sarapan', '', 'Hotel Madinah'),
        makeEvent(8, 3, '07.30', 'Ziarah dalam', 'Baqi, makam Rasulullah ﷺ, Abu Bakar RA, Umar RA, dan Raudhah. Waktu tentatif.', 'Masjid Nabawi'),
        makeEvent(8, 4, '12.00', 'Shalat Zuhur dan makan siang', '', 'Madinah'),
        makeEvent(8, 5, '15.00', 'Jamaah memaksimalkan ibadah masing-masing di Masjid Nabawi', '', 'Masjid Nabawi'),
        makeEvent(8, 6, '19.00', 'Shalat Magrib, Isya, dan makan malam', '', 'Masjid Nabawi'),
      ],
    },
    {
      dayNumber: 9, date: '2026-10-05', weekday: 'Senin', title: 'City Tour Madinah', city: 'Madinah',
      events: [
        makeEvent(9, 1, '04.00', 'Tahajud dan Shalat Subuh', '', 'Masjid Nabawi'),
        makeEvent(9, 2, '06.00', 'Sarapan', '', 'Hotel Madinah'),
        makeEvent(9, 3, '07.30', 'City tour dan ziarah', 'Masjid Quba, Jabal Uhud, Masjid Khandak, Kebun Kurma, dan Masjid Qiblatain.', 'Madinah'),
        makeEvent(9, 4, '12.00', 'Shalat Zuhur dan makan siang', '', 'Madinah'),
        makeEvent(9, 5, '15.00', 'Jamaah memaksimalkan ibadah masing-masing di Masjid Nabawi', '', 'Masjid Nabawi'),
        makeEvent(9, 6, '18.00', 'Shalat Magrib, Isya, dan makan malam', '', 'Masjid Nabawi'),
      ],
    },
    {
      dayNumber: 10, date: '2026-10-06', weekday: 'Selasa', title: 'Madinah · Free Program', city: 'Madinah',
      events: [
        makeEvent(10, 1, '04.00', 'Tahajud dan Shalat Subuh', '', 'Masjid Nabawi'),
        makeEvent(10, 2, '06.00', 'Sarapan dan ibadah mandiri', '', 'Madinah'),
        makeEvent(10, 3, '12.00', 'Shalat Zuhur dan makan siang', '', 'Madinah'),
        makeEvent(10, 4, '15.00', 'Jamaah memaksimalkan ibadah masing-masing di Masjid Nabawi', '', 'Masjid Nabawi'),
        makeEvent(10, 5, '18.00', 'Shalat Magrib, Isya, dan makan malam', '', 'Masjid Nabawi'),
      ],
    },
    {
      dayNumber: 11, date: '2026-10-07', weekday: 'Rabu', title: 'Jabal Magnet', city: 'Madinah',
      events: [
        makeEvent(11, 1, '04.00', 'Tahajud dan Shalat Subuh', '', 'Masjid Nabawi'),
        makeEvent(11, 2, '06.00', 'Sarapan', '', 'Hotel Madinah'),
        makeEvent(11, 3, '07.00', 'Jabal Magnet dan museum Madinah', '', 'Madinah'),
        makeEvent(11, 4, '15.00', 'Shalat Asar berjamaah', '', 'Masjid Nabawi'),
        makeEvent(11, 5, '18.00', 'Shalat Magrib, Isya, dan makan malam', '', 'Masjid Nabawi'),
      ],
    },
    {
      dayNumber: 12, date: '2026-10-08', weekday: 'Kamis', title: 'Madinah → Bandara', city: 'Madinah',
      events: [
        makeEvent(12, 1, '04.00', 'Tahajud, Shalat Subuh, dan Ziarah Wada', '', 'Masjid Nabawi'),
        makeEvent(12, 2, '06.00', 'Sarapan', '', 'Hotel Madinah'),
        makeEvent(12, 3, '13.00', 'Check-out menuju bandara', '', 'Hotel Madinah'),
        makeEvent(12, 4, '14.30', 'Tiba di bandara Madinah', '', 'Bandara Prince Mohammad bin Abdulaziz'),
        makeEvent(12, 5, '17.35', 'Terbang menuju Dubai dan Jakarta', 'Penerbangan Emirates EK810G dan EK356G.', 'Bandara Madinah'),
      ],
    },
    {
      dayNumber: 13, date: '2026-10-09', weekday: 'Jumat', title: 'Tiba di Jakarta', city: 'Jakarta',
      events: [
        makeEvent(13, 1, '15.40', 'Tiba di Bandara Soekarno–Hatta', 'Program umrah bersama Ash‑Shiddiq Tour & Travel selesai. Semoga ibadah diterima Allah SWT.', 'Jakarta'),
      ],
    },
  ],
};

const simpleDay = (
  dayNumber: number,
  date: string,
  weekday: string,
  title: string,
  city: string,
  events: Array<[string, string, string?, string?]>,
): ItineraryDay => ({
  dayNumber, date, weekday, title, city,
  events: events.map(([time, eventTitle, details = '', location = ''], index) =>
    makeEvent(dayNumber, index + 1, time, eventTitle, details, location)),
});

export const itinerary29Seed: ItineraryPayload = {
  tripSlug: '29-september-2026',
  tripName: 'Umrah Grup 29 September Ash‑Shiddiq',
  dateRange: '29 September–12 Oktober 2026',
  departureAt: '2026-09-29T09:10:00+07:00',
  tripEndAt: '2026-10-12T10:25:00+07:00',
  departureLabel: 'Selasa, 29 September 2026',
  theme: 'indigo',
  timezoneNote: 'Seluruh waktu mengikuti waktu setempat.',
  notice: 'Jadwal dapat menyesuaikan kondisi di lapangan. Pantau halaman ini untuk informasi terbaru dari tim Ash‑Shiddiq.',
  updatedAt: '2026-09-19T00:00:00.000Z',
  highlights: [
    'Akomodasi: 2 kamar double dan 1 kamar quad',
    'Hotel Makkah: check-in 29 September · check-out 4 Oktober 2026',
    'Hotel Madinah: check-in 4 Oktober · check-out 11 Oktober 2026',
  ],
  support: {
    tourLeader: { name: '', phone: '' },
    mutawwif: { name: '', phone: '' },
    hotels: {
      makkah: { name: '', address: '' },
      madinah: { name: '', address: '' },
    },
  },
  flights: [
    { date: '29 Sep 2026', flight: 'SV 817', route: 'Jakarta → Jeddah', time: '09.10—14.40' },
    { date: '11–12 Okt 2026', flight: 'SV 820', route: 'Madinah → Jakarta', time: '20.25—10.25 (+1)' },
  ],
  days: [
    simpleDay(1, '2026-09-29', 'Selasa', 'Tiba di Jeddah · Umrah Pertama', 'Makkah', [
      ['09.10', 'Penerbangan SV 817 menuju Jeddah', 'Persiapan perjalanan dan niat ihram mengikuti arahan pembimbing.', 'Jakarta'],
      ['14.40', 'Tiba di Jeddah', 'Proses kedatangan lalu perjalanan menuju hotel.', 'Bandara King Abdul Aziz'],
      ['17.00', 'Check-in hotel Makkah', 'Pembagian kamar: 2 double dan 1 quad.', 'Hotel Makkah'],
      ['20.00', 'Umrah pertama', 'Thawaf, sa’i, dan tahallul bersama pembimbing.', 'Masjidil Haram'],
    ]),
    simpleDay(2, '2026-09-30', 'Rabu', 'Makkah · Free Program', 'Makkah', [
      ['04.00', 'Shalat Subuh berjamaah', '', 'Masjidil Haram'],
      ['06.00', 'Sarapan dan istirahat', '', 'Hotel Makkah'],
      ['08.00', 'Free Program dan memperbanyak ibadah', 'Waktu dapat digunakan untuk ibadah mandiri dan istirahat.', 'Makkah'],
    ]),
    simpleDay(3, '2026-10-01', 'Kamis', 'City Tour Thaif · Umrah Kedua', 'Thaif', [
      ['07.30', 'Berangkat menuju Thaif', 'Berkumpul di lobi hotel.', 'Hotel Makkah'],
      ['12.00', 'City tour Thaif dan miqat', 'Kegiatan mengikuti arahan tim pendamping.', 'Thaif'],
      ['18.00', 'Umrah kedua', 'Thawaf, sa’i, dan tahallul.', 'Masjidil Haram'],
    ]),
    simpleDay(4, '2026-10-02', 'Jumat', 'Makkah · Free Program', 'Makkah', [
      ['04.00', 'Shalat Subuh berjamaah', '', 'Masjidil Haram'],
      ['11.00', 'Shalat Jumat berjamaah', '', 'Masjidil Haram'],
      ['13.00', 'Free Program dan ibadah mandiri', '', 'Makkah'],
    ]),
    simpleDay(5, '2026-10-03', 'Sabtu', 'City Tour Jiranah · Umrah Ketiga', 'Makkah', [
      ['07.30', 'City tour Makkah', 'Jabal Tsur, Arafah, Jabal Rahmah, Muzdalifah, Mina, Jamarat, dan Jabal Nur.', 'Makkah'],
      ['12.00', 'Miqat di Jiranah', 'Persiapan umrah bersama pembimbing.', 'Jiranah'],
      ['18.00', 'Umrah ketiga', 'Thawaf, sa’i, dan tahallul.', 'Masjidil Haram'],
    ]),
    simpleDay(6, '2026-10-04', 'Ahad', 'Thawaf Wada · Menuju Madinah', 'Perjalanan', [
      ['04.00', 'Shalat Subuh dan Thawaf Wada', '', 'Masjidil Haram'],
      ['06.00', 'Sarapan dan check-out hotel Makkah', '', 'Hotel Makkah'],
      ['14.00', 'Berangkat menuju Madinah', 'Perjalanan mengikuti arahan tim pendamping.', 'Makkah → Madinah'],
      ['21.00', 'Check-in hotel Madinah', 'Makan malam, pembagian kamar, dan istirahat.', 'Hotel Madinah'],
    ]),
    simpleDay(7, '2026-10-05', 'Senin', 'Ziarah Madinah', 'Madinah', [
      ['07.30', 'Ziarah dan city tour Madinah', 'Program bersama Grup 27: Masjid Quba, Jabal Uhud, Masjid Khandak, Kebun Kurma, dan Masjid Qiblatain.', 'Madinah'],
      ['12.00', 'Shalat Zuhur dan makan siang', '', 'Madinah'],
      ['15.00', 'Jamaah memaksimalkan ibadah masing-masing di Masjid Nabawi', '', 'Masjid Nabawi'],
    ]),
    ...[
      ['2026-10-06', 'Selasa'], ['2026-10-07', 'Rabu'], ['2026-10-08', 'Kamis'],
      ['2026-10-09', 'Jumat'], ['2026-10-10', 'Sabtu'],
    ].map(([date, weekday], index) => index === 1
      ? simpleDay(9, date, weekday, 'Jabal Magnet', 'Madinah', [
          ['04.00', 'Tahajud dan Shalat Subuh', '', 'Masjid Nabawi'],
          ['06.00', 'Sarapan', '', 'Hotel Madinah'],
          ['07.00', 'Jabal Magnet dan museum Madinah', '', 'Madinah'],
          ['15.00', 'Shalat Asar berjamaah', '', 'Masjid Nabawi'],
          ['18.00', 'Shalat Magrib, Isya, dan makan malam', '', 'Masjid Nabawi'],
        ])
      : simpleDay(index + 8, date, weekday, 'Madinah · Free Program', 'Madinah', [
          ['04.00', 'Shalat Subuh berjamaah', '', 'Masjid Nabawi'],
          ['06.00', 'Sarapan dan ibadah mandiri', '', 'Hotel Madinah'],
          ['08.00', 'Jamaah memaksimalkan ibadah masing-masing di Masjid Nabawi', '', 'Masjid Nabawi'],
          ['20.00', 'Makan malam dan istirahat', '', 'Hotel Madinah'],
        ])),
    simpleDay(13, '2026-10-11', 'Ahad', 'Madinah · Kepulangan', 'Madinah', [
      ['04.00', 'Shalat Subuh dan ziarah wada', '', 'Masjid Nabawi'],
      ['06.00', 'Sarapan dan persiapan check-out', '', 'Hotel Madinah'],
      ['12.00', 'Check-out hotel Madinah', 'Bagasi dan dokumen diperiksa sebelum menuju bandara.', 'Hotel Madinah'],
      ['20.25', 'Penerbangan SV 820 menuju Jakarta', '', 'Bandara Madinah'],
    ]),
    simpleDay(14, '2026-10-12', 'Senin', 'Tiba di Jakarta', 'Jakarta', [
      ['10.25', 'Tiba di Jakarta', 'Rangkaian perjalanan Grup 29 September selesai. Semoga ibadah diterima Allah SWT.', 'Jakarta'],
    ]),
  ],
};

export const itinerarySeeds = {
  '27-september-2026': itinerarySeed,
  '29-september-2026': itinerary29Seed,
} as const;

export type TripSlug = keyof typeof itinerarySeeds;
export const defaultTripSlug: TripSlug = '27-september-2026';

export function resolveTripSlug(value: string | null | undefined): TripSlug {
  return value === '29-september-2026' ? value : defaultTripSlug;
}
