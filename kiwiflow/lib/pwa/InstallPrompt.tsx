"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const DISMISSED_KEY = "kf-install-dismissed";

// Chrome's install prompt event isn't in lib.dom.d.ts yet.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type BannerState = { kind: "hidden" } | { kind: "ios" } | { kind: "prompt"; event: BeforeInstallPromptEvent };

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone === true;
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

// Excludes Chrome/Edge/Android WebView/Firefox-on-iOS, which all include
// "Safari" in their UA string too — this is the standard way to isolate
// actual Safari (desktop or iOS), the only engine with no beforeinstallprompt.
function isSafari(): boolean {
  const ua = navigator.userAgent;
  return /safari/i.test(ua) && !/chrome|chromium|crios|android|edg|fxios/i.test(ua);
}

/**
 * A small, dismissible "install this as an app" banner.
 *
 * - Chrome/Edge (Windows, macOS, Android, ChromeOS, Linux): captures the
 *   real `beforeinstallprompt` event and offers a one-click install button.
 * - Safari (iOS and macOS): there is no install-prompt API at all, so this
 *   shows the manual "Share → Add to Home Screen / Add to Dock" steps
 *   instead — that's a real platform limitation, not something worth
 *   pretending we can automate.
 * - Every other case (already installed, already dismissed, or a browser
 *   with neither mechanism): renders nothing.
 */
export function InstallPrompt() {
  const [banner, setBanner] = useState<BannerState>({ kind: "hidden" });

  useEffect(() => {
    if (isStandalone() || window.localStorage.getItem(DISMISSED_KEY) === "1") return;

    if (isIOS() || isSafari()) {
      // One-shot, client-only UA detection with no server-side equivalent —
      // not a response to a later external event, so it can't move into the
      // beforeinstallprompt handler below. Rendering "hidden" on the server
      // and flipping this after mount is what keeps hydration consistent;
      // reading navigator.userAgent during render instead would break SSR.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBanner({ kind: "ios" });
      return;
    }

    const handler = (event: Event) => {
      event.preventDefault();
      setBanner({ kind: "prompt", event: event as BeforeInstallPromptEvent });
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setBanner({ kind: "hidden" });
  }

  async function install() {
    if (banner.kind !== "prompt") return;
    await banner.event.prompt();
    await banner.event.userChoice;
    dismiss();
  }

  if (banner.kind === "hidden") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 print:hidden">
      <div className="flex w-full max-w-md items-center gap-3 rounded-lg border border-kf-border bg-kf-card p-3 shadow-lg">
        <Image src="/icons/icon-192.png" alt="" width={36} height={36} className="rounded-md" />
        <div className="flex-1 text-sm">
          <p className="font-medium text-kf-charcoal">Install KiwiFlow</p>
          {banner.kind === "prompt" ? (
            <p className="text-kf-muted">Adds it to your desktop/home screen — opens like a normal app.</p>
          ) : (
            <p className="text-kf-muted">
              Tap the Share icon, then &ldquo;Add to Home Screen&rdquo;{isIOS() ? "" : " (or “Add to Dock”)"}.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {banner.kind === "prompt" ? (
            <button
              type="button"
              onClick={install}
              className="btn rounded-md bg-kf-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-kf-green-700"
            >
              Install
            </button>
          ) : null}
          <button type="button" onClick={dismiss} className="text-xs text-kf-muted underline">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
