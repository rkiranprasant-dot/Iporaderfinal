import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef } from "react";

import { IPOEvent } from "@/constants/mockData";
import { sendIPOStatusNotification } from "@/lib/notifications";

const SNAPSHOT_KEY = "@ipo_status_snapshot_v1";

type StatusSnapshot = Record<string, string>;

async function loadSnapshot(): Promise<StatusSnapshot> {
  try {
    const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StatusSnapshot;
  } catch {
    return {};
  }
}

async function saveSnapshot(snapshot: StatusSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch { /* non-fatal */ }
}

interface UseIPOStatusWatcherOptions {
  events: IPOEvent[];
  watchlist: string[];
  notificationsGranted: boolean;
}

export function useIPOStatusWatcher({
  events,
  watchlist,
  notificationsGranted,
}: UseIPOStatusWatcherOptions): void {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!notificationsGranted || watchlist.length === 0 || events.length === 0) return;

    const check = async () => {
      const snapshot = await loadSnapshot();
      const nextSnapshot: StatusSnapshot = { ...snapshot };
      const changes: Array<{ event: IPOEvent; oldStatus: string }> = [];

      for (const id of watchlist) {
        const event = events.find((e) => e.id === id);
        if (!event) continue;

        const currentType = event.eventType;
        const previousType = snapshot[id];

        if (previousType === undefined) {
          nextSnapshot[id] = currentType;
          continue;
        }

        if (previousType !== currentType) {
          changes.push({ event, oldStatus: previousType });
          nextSnapshot[id] = currentType;
        }
      }

      await saveSnapshot(nextSnapshot);

      if (initializedRef.current) {
        for (const { event, oldStatus } of changes) {
          await sendIPOStatusNotification({
            company: event.company,
            exchange: event.exchange,
            oldStatus,
            newStatus: event.eventType,
            eventId: event.id,
          });
        }
      } else {
        initializedRef.current = true;
      }
    };

    void check();
  }, [events, watchlist, notificationsGranted]);
}
