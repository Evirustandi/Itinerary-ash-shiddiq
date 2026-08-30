import { ItineraryApp } from '@/components/itinerary-app';
import { itinerarySeed } from '@/lib/itinerary-data';

export default function Home() {
  return <ItineraryApp initialData={itinerarySeed} />;
}
