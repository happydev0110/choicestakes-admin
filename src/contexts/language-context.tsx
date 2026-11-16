"use client";

import { en } from "@/locales/en";

// Preserve the shared labels API without restoring old saved language settings.
const language = { t: en };

export function useLanguage() {
  return language;
}
