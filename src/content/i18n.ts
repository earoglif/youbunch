import { useEffect, useState } from "react";
import { getCurrentLanguage } from "../utils/getCurrentLanguage";
import { ensureI18n, i18n } from "../shared/i18n";
import { normalizeLanguage } from "../shared/i18n/normalize";
import en from "../shared/locales/en.json";

type TranslationKey = keyof typeof en;
type AppLanguage = ReturnType<typeof normalizeLanguage>;
type LanguageChangeSubscriber = () => void;

let activeLanguage: AppLanguage | null = null;
const subscribers = new Set<LanguageChangeSubscriber>();

function notifySubscribers(): void {
  subscribers.forEach((notifySubscriber) => notifySubscriber());
}

function syncLanguage(): void {
  const nextLanguage = normalizeLanguage(getCurrentLanguage());
  if (nextLanguage === activeLanguage) return;
  activeLanguage = nextLanguage;

  void ensureI18n()
    .then(() => i18n.changeLanguage(nextLanguage))
    .then(() => {
      notifySubscribers();
    })
    .catch(() => {
      notifySubscribers();
    });
}

export function t(key: TranslationKey): string {
  return i18n.t(key);
}

export function useLanguageSync(): void {
  const [, setRevision] = useState(0);

  useEffect(() => {
    const rerender = () => setRevision((revision) => revision + 1);
    subscribers.add(rerender);
    syncLanguage();
    window.addEventListener("yt-navigate-finish", syncLanguage);
    window.addEventListener("yt-page-data-updated", syncLanguage);

    return () => {
      subscribers.delete(rerender);
      window.removeEventListener("yt-navigate-finish", syncLanguage);
      window.removeEventListener("yt-page-data-updated", syncLanguage);
    };
  }, []);
}

syncLanguage();
