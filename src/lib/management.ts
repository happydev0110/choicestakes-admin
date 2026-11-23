export interface Player {
  id: string;
  email: string;
  displayName: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
}
export interface PlayerDetails extends Player {
  activeSessions: number;
}
export interface Game {
  uuid: string;
  name: string;
  provider: string;
  vendor: string;
  code: string;
  currency: string;
  imageUrl: string | null;
  available: boolean;
  visible: boolean;
  categories: string[];
  syncedAt: string;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}
export interface GamePage extends Page<Game> {
  currency: string;
  providers: string[];
  categories: string[];
  sync: {
    status: string;
    lastSuccessAt: string | null;
    lastAttemptAt: string | null;
    providerTotal: number | null;
    errorCode: string | null;
  } | null;
}
export class ManagementError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}
export async function managementRequest<T>(
  path: string,
  body?: unknown,
  method: "POST" | "PATCH" = "PATCH"
): Promise<T> {
  let response: Response;
  try {
    response = await fetch("/api/admin/manage/" + path, {
      method: body === undefined ? "GET" : method,
      cache: "no-store",
      credentials: "same-origin",
      headers:
        body === undefined
          ? undefined
          : {
              "Content-Type": "application/json",
              "X-Requested-With": "choicestakes-admin",
            },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new ManagementError(
      "Unable to reach the admin service. Check your connection and try again.",
      503
    );
  }
  const result = await response.json().catch(() => null);
  if (response.status === 401) window.location.replace("/login");
  if (!response.ok || !result?.success)
    throw new ManagementError(
      result?.error?.message || "Unable to complete this request.",
      response.status
    );
  return result.data;
}
export const categoryNames: Record<string, string> = {
  featured: "Featured",
  "new-games": "New games",
  slots: "Slots",
  live: "Live casino",
  "crash-instant": "Crash & instant",
  "table-cards": "Table & cards",
  "lotto-scratch": "Lotto & scratch",
  roulette: "Roulette",
  poker: "Poker",
  blackjack: "Blackjack",
  baccarat: "Baccarat",
  bingo: "Bingo",
};
export function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "Not yet";
}
