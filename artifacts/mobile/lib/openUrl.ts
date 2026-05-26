import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

/**
 * Cross-platform URL opener.
 * - Native: opens an in-app browser (iOS SafariViewController / Android Chrome Custom Tab)
 * - Web: uses a hidden <a> click which works even inside sandboxed iframes where
 *   window.open() is blocked by popup blockers.
 */
export function openUrl(url: string): void {
  if (!url) return;

  if (Platform.OS !== "web") {
    void WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
    return;
  }

  // Web: create a temporary <a> element and dispatch a click.
  // This bypasses popup blockers because it's a real DOM interaction.
  try {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    // Clean up after a tick so the click event propagates
    setTimeout(() => { try { document.body.removeChild(a); } catch { /* noop */ } }, 100);
  } catch {
    // Last resort fallback
    try { window.open(url, "_blank", "noopener,noreferrer"); } catch { /* noop */ }
  }
}
