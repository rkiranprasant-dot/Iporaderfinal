import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function getNotificationPermissionStatus(): Promise<Notifications.PermissionStatus> {
  if (Platform.OS === "web") return "undetermined" as Notifications.PermissionStatus;
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export interface IPOStatusNotificationPayload {
  company: string;
  exchange: string;
  oldStatus: string;
  newStatus: string;
  eventId: string;
}

const STATUS_VERBS: Record<string, string> = {
  S1_FILED: "S-1 Filed",
  BOOK_BUILDING: "Book-Building",
  PRICING: "Priced",
  ALLOTMENT: "Allotment",
  DAY1_LISTING: "Day 1 Listing",
  DIRECT_LISTING: "Direct Listing",
  UPLISTING: "Uplisted",
  SPAC: "SPAC",
  WITHDRAWAL: "Withdrawn ⚠",
  RUMOR: "Rumor",
};

function statusEmoji(newStatus: string): string {
  switch (newStatus) {
    case "PRICING": return "💰";
    case "DAY1_LISTING": return "🚀";
    case "ALLOTMENT": return "✅";
    case "BOOK_BUILDING": return "📋";
    case "S1_FILED": return "📄";
    case "WITHDRAWAL": return "⚠️";
    case "UPLISTING": return "📈";
    default: return "🔔";
  }
}

export async function sendIPOStatusNotification(
  payload: IPOStatusNotificationPayload
): Promise<void> {
  if (Platform.OS === "web") return;
  const { company, exchange, oldStatus, newStatus } = payload;
  const emoji = statusEmoji(newStatus);
  const fromLabel = STATUS_VERBS[oldStatus] ?? oldStatus;
  const toLabel = STATUS_VERBS[newStatus] ?? newStatus;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${emoji} ${company}`,
      body: `Status update: ${fromLabel} → ${toLabel} · ${exchange}`,
      data: { eventId: payload.eventId, type: "ipo_status_change" },
      sound: true,
    },
    trigger: null,
  });
}

export async function sendWatchlistAddedNotification(
  company: string,
  eventType: string
): Promise<void> {
  if (Platform.OS === "web") return;
  const label = STATUS_VERBS[eventType] ?? eventType;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🔖 Tracking ${company}`,
      body: `You'll be notified when its status changes. Current: ${label}`,
      data: { type: "watchlist_added" },
      sound: false,
    },
    trigger: null,
  });
}
