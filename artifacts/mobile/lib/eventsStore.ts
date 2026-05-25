import { IPOEvent } from "@/constants/mockData";
import { MOCK_IPO_EVENTS } from "@/constants/mockData";

let _liveEvents: IPOEvent[] = [];

export function updateLiveEventsCache(events: IPOEvent[]): void {
  _liveEvents = events;
}

export function findEventById(id: string): IPOEvent | undefined {
  if (_liveEvents.length > 0) {
    const found = _liveEvents.find((e) => e.id === id);
    if (found) return found;
  }
  return MOCK_IPO_EVENTS.find((e) => e.id === id);
}
