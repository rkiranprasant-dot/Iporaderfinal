import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const WATCHLIST_KEY = "@ipo_intelligence_watchlist_v1";

interface WatchlistContextType {
  watchlist: string[];
  isWatched: (id: string) => boolean;
  toggleWatch: (id: string) => void;
}

const WatchlistContext = createContext<WatchlistContextType>({
  watchlist: [],
  isWatched: () => false,
  toggleWatch: () => {},
});

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(WATCHLIST_KEY)
      .then((data) => {
        if (data) {
          const parsed = JSON.parse(data) as string[];
          setWatchlist(parsed);
        }
      })
      .catch(() => {});
  }, []);

  const toggleWatch = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWatchlist((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isWatched = useCallback(
    (id: string) => watchlist.includes(id),
    [watchlist]
  );

  return (
    <WatchlistContext.Provider value={{ watchlist, isWatched, toggleWatch }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  return useContext(WatchlistContext);
}
