import { notFound } from 'next/navigation';
import { ItineraryApp } from '@/components/itinerary-app';
import { itinerarySeeds, type TripSlug } from '@/lib/itinerary-data';

export default async function ItineraryGroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(slug in itinerarySeeds)) notFound();
  return <ItineraryApp initialData={itinerarySeeds[slug as TripSlug]} />;
}
