"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { managementRequest, formatDate, type Page } from "@/lib/management";
import {
  displayXp,
  tierLabels,
  type LoyaltySettings,
  type LoyaltyPlayer,
  type LoyaltyDetails,
} from "@/lib/loyalty";
import { toast } from "@/lib/toast";
import { EditorModal, LoadError, Pager } from "./common";

const accents = [
  "border-slate-400/40",
  "border-orange-500/40",
  "border-slate-300/70",
  "border-amber-400/60",
  "border-teal-400/50",
  "border-violet-400/50",
];
const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

function ThresholdForm({
  settings,
  reload,
}: {
  settings: LoyaltySettings;
  reload: () => void;
}) {
  const client = useQueryClient();
  const [tiers, setTiers] = useState(settings.tiers);
  const [reason, setReason] = useState("");
  const changed = tiers.some(
    (tier, index) => Number(tier.minXp) !== Number(settings.tiers[index].minXp)
  );
  const valid = tiers.every(
    (tier, index) =>
      /^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(tier.minXp) &&
      (index === 0
        ? Number(tier.minXp) === 0
        : Number(tier.minXp) > Number(tiers[index - 1].minXp))
  );
  const save = useMutation({
    mutationFn: () =>
      managementRequest("loyalty/settings", {
        expectedVersion: settings.version,
        tiers,
        reason,
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["loyalty"] });
      toast.success("Tier thresholds updated");
    },
  });
  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid && changed) save.mutate();
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Tier thresholds</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Set the total XP required to reach each tier. Basic always starts at
            zero.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={save.isPending}
          onClick={reload}
        >
          <RefreshCw />
          Reload settings
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiers.map((tier, index) => (
          <div
            key={tier.code}
            className={`rounded-xl border bg-card p-5 ${accents[index]}`}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{tierLabels[tier.code]}</h3>
              <Trophy className="h-6 w-6 text-muted-foreground" />
            </div>
            <label
              className="block space-y-2 text-sm"
              htmlFor={`tier-${tier.code}`}
            >
              <span className="text-muted-foreground">Minimum XP</span>
              <Input
                id={`tier-${tier.code}`}
                type="number"
                min="0"
                max="999999999.99"
                step="0.01"
                required
                value={tier.minXp}
                disabled={index === 0 || save.isPending}
                onChange={(event) =>
                  setTiers((current) =>
                    current.map((item) =>
                      item.code === tier.code
                        ? { ...item, minXp: event.target.value }
                        : item
                    )
                  )
                }
              />
            </label>
          </div>
        ))}
      </div>
      <div className="space-y-4 rounded-xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          Saving recalculates player tiers from their existing XP. It does not
          change XP balances. All changes are recorded with your administrator
          account.
        </p>
        <label className="block space-y-2 text-sm" htmlFor="tier-reason">
          <span className="font-medium">Reason for changing thresholds</span>
          <textarea
            id="tier-reason"
            className={fieldClass}
            rows={2}
            minLength={3}
            maxLength={500}
            required
            value={reason}
            disabled={save.isPending}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain why the tier requirements are changing"
          />
        </label>
        {!valid && (
          <p role="alert" className="text-sm text-destructive">
            Thresholds must increase from Basic to Diamond and use at most two
            decimal places.
          </p>
        )}
        {save.error && (
          <p role="alert" className="text-sm text-destructive">
            {save.error.message}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Version {settings.version} · Updated{" "}
            {formatDate(settings.updatedAt)}
          </p>
          <Button
            disabled={
              !changed || !valid || reason.trim().length < 3 || save.isPending
            }
          >
            {save.isPending ? "Saving..." : "Save thresholds"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Progress({ player }: { player: LoyaltyPlayer }) {
  return (
    <div className="min-w-40 space-y-2">
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label={`${player.displayName} tier progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={player.progressPercent}
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${player.progressPercent}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {player.nextTier
          ? `${displayXp(player.xpToNext)} XP to ${player.nextTier}`
          : "Highest tier reached"}
      </p>
    </div>
  );
}

function AdjustmentForm({
  player,
  busy,
  reload,
}: {
  player: LoyaltyPlayer;
  busy: (value: boolean) => void;
  reload: () => void;
}) {
  const client = useQueryClient();
  const [direction, setDirection] = useState("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const request = useRef<{ payload: string; id: string } | null>(null);
  const delta = direction === "deduct" ? -Number(amount) : Number(amount);
  const after = Number(player.xp) + delta;
  const valid =
    /^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(amount) &&
    Number(amount) > 0 &&
    after >= 0 &&
    after <= 999999999.99;
  const save = useMutation({
    mutationFn: () => {
      const payload = {
        expectedVersion: player.version,
        deltaXp: `${direction === "deduct" ? "-" : ""}${amount}`,
        reason: reason.trim(),
      };
      const signature = JSON.stringify(payload);
      if (request.current?.payload !== signature)
        request.current = { payload: signature, id: crypto.randomUUID() };
      return managementRequest(
        `loyalty/players/${player.id}/adjustments`,
        { ...payload, requestId: request.current.id },
        "POST"
      );
    },
    onMutate: () => busy(true),
    onSettled: () => busy(false),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["loyalty"] });
      toast.success("Player XP updated");
    },
  });
  return (
    <form
      className="space-y-4 rounded-lg border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) save.mutate();
      }}
    >
      <h3 className="font-semibold">Adjust XP</h3>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-2 text-sm" htmlFor="xp-direction">
          <span>Action</span>
          <Select
            id="xp-direction"
            value={direction}
            disabled={save.isPending}
            onChange={(event) => setDirection(event.target.value)}
          >
            <option value="add">Add XP</option>
            <option value="deduct">Deduct XP</option>
          </Select>
        </label>
        <label className="block space-y-2 text-sm" htmlFor="xp-amount">
          <span>Amount</span>
          <Input
            id="xp-amount"
            type="number"
            min="0.01"
            max="999999999.99"
            step="0.01"
            required
            value={amount}
            disabled={save.isPending}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
          />
        </label>
      </div>
      <label className="block space-y-2 text-sm" htmlFor="xp-reason">
        <span>Reason</span>
        <textarea
          id="xp-reason"
          className={fieldClass}
          rows={2}
          minLength={3}
          maxLength={500}
          required
          value={reason}
          disabled={save.isPending}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Explain this XP correction"
        />
      </label>
      {amount && (
        <p
          className={`text-sm ${valid ? "text-muted-foreground" : "text-destructive"}`}
          role="status"
        >
          {valid
            ? `Resulting balance: ${displayXp(after.toFixed(2))} XP`
            : "Enter a valid amount. The resulting XP cannot be negative or exceed 999,999,999.99."}
        </p>
      )}
      {save.error && (
        <div role="alert" className="text-sm text-destructive">
          <p>{save.error.message}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-2"
            onClick={reload}
          >
            Reload player
          </Button>
        </div>
      )}
      <Button
        className="w-full"
        disabled={!valid || reason.trim().length < 3 || save.isPending}
      >
        {direction === "deduct" ? <ArrowDownLeft /> : <ArrowUpRight />}
        {save.isPending
          ? "Saving..."
          : direction === "deduct"
            ? "Deduct XP"
            : "Add XP"}
      </Button>
    </form>
  );
}

function PlayerEditor({ id, close }: { id: string; close: () => void }) {
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const details = useQuery({
    queryKey: ["loyalty", "player", id, page],
    queryFn: () =>
      managementRequest<LoyaltyDetails>(`loyalty/players/${id}?page=${page}`),
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  return (
    <EditorModal title="Player loyalty XP" busy={busy} onClose={close}>
      {details.isPending ? (
        <p role="status">Loading player XP...</p>
      ) : details.error ? (
        <LoadError
          error={details.error}
          onRetry={() => void details.refetch()}
        />
      ) : (
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold">
              {details.data.player.displayName}
            </h3>
            <p className="break-all text-sm text-muted-foreground">
              {details.data.player.email}
            </p>
          </div>
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <div className="flex justify-between gap-3">
              <strong className="text-2xl">
                {displayXp(details.data.player.xp)}{" "}
                <span className="text-sm font-normal">XP</span>
              </strong>
              <span className="rounded-full border px-3 py-1 text-sm">
                {details.data.player.tierName}
              </span>
            </div>
            <Progress player={details.data.player} />
          </div>
          <AdjustmentForm
            key={`${id}-${details.data.player.version}`}
            player={details.data.player}
            busy={setBusy}
            reload={() => void details.refetch()}
          />
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <History className="h-4 w-4" />
              Adjustment history
            </h3>
            {!details.data.history.items.length ? (
              <p className="text-sm text-muted-foreground">
                No XP adjustments yet.
              </p>
            ) : (
              <ol className="divide-y rounded-lg border px-4">
                {details.data.history.items.map((entry) => (
                  <li key={entry.id} className="space-y-1 py-4">
                    <div className="flex justify-between gap-3">
                      <strong
                        className={
                          entry.deltaXp.startsWith("-")
                            ? "text-destructive"
                            : "text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {entry.deltaXp.startsWith("-") ? "" : "+"}
                        {displayXp(entry.deltaXp)} XP
                      </strong>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(entry.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm">
                      {entry.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.adminName} · {displayXp(entry.beforeXp)} →{" "}
                      {displayXp(entry.afterXp)} XP
                    </p>
                  </li>
                ))}
              </ol>
            )}
            {details.data.history.total > details.data.history.perPage && (
              <Pager
                {...details.data.history}
                pending={details.isFetching || busy}
                onChange={setPage}
              />
            )}
          </section>
        </div>
      )}
    </EditorModal>
  );
}

function PlayersPanel({ settings }: { settings: LoyaltySettings }) {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const players = useQuery({
    queryKey: ["loyalty", "players", search, tier, page, settings.version],
    queryFn: () =>
      managementRequest<Page<LoyaltyPlayer>>(
        "loyalty/players?" +
          new URLSearchParams({ search, tier, page: String(page) })
      ),
    retry: false,
  });
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Player XP</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review progress and make recorded XP corrections.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={players.isFetching}
          onClick={() => void players.refetch()}
        >
          <RefreshCw />
          Refresh players
        </Button>
      </div>
      <form
        className="flex flex-wrap gap-3 rounded-xl border bg-card p-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(draft.trim());
          setPage(1);
        }}
      >
        <Input
          className="min-w-48 flex-1"
          aria-label="Search loyalty players"
          placeholder="Search by name, email or player ID"
          maxLength={100}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Select
          className="w-full sm:w-40"
          aria-label="Filter loyalty tier"
          value={tier}
          onChange={(event) => {
            setTier(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All tiers</option>
          {settings.tiers.map((item) => (
            <option key={item.code} value={item.code}>
              {tierLabels[item.code]}
            </option>
          ))}
        </Select>
        <Button>
          <Search />
          Search
        </Button>
      </form>
      {players.isPending ? (
        <p role="status" className="p-10 text-center">
          Loading player XP...
        </p>
      ) : players.error ? (
        <LoadError
          error={players.error}
          onRetry={() => void players.refetch()}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          {players.data.items.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Total XP</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Next tier</TableHead>
                  <TableHead className="text-right">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.data.items.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      <p className="font-medium">{player.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.email}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-semibold">
                      {displayXp(player.xp)}
                    </TableCell>
                    <TableCell>{player.tierName}</TableCell>
                    <TableCell>
                      <Progress player={player} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`Manage XP for ${player.displayName}`}
                        onClick={() => setSelected(player.id)}
                      >
                        <SlidersHorizontal />
                        Manage XP
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <h3 className="font-semibold">No players found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {search || tier
                  ? "Try another search or tier."
                  : "Portal players will appear here with zero XP until progress is recorded."}
              </p>
            </div>
          )}
          <Pager
            {...players.data}
            pending={players.isFetching}
            onChange={setPage}
          />
        </div>
      )}
      {selected && (
        <PlayerEditor id={selected} close={() => setSelected(null)} />
      )}
    </div>
  );
}

export default function LoyaltyPage() {
  const [section, setSection] = useState("tiers");
  const settings = useQuery({
    queryKey: ["loyalty", "settings"],
    queryFn: () => managementRequest<LoyaltySettings>("loyalty/settings"),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Trophy className="h-8 w-8 text-primary" />
            Loyalty XP
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage tier requirements and player progress.
          </p>
        </div>
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-700 dark:text-amber-300">
          Sandbox
        </span>
      </div>
      <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        XP changes here affect sandbox loyalty records. Automatic XP from bets
        and the portal progress display are not connected yet. Wallet balances
        and cashback are unaffected.
      </p>
      <div className="flex gap-2" aria-label="Loyalty management sections">
        <Button
          variant={section === "tiers" ? "default" : "outline"}
          aria-pressed={section === "tiers"}
          onClick={() => setSection("tiers")}
        >
          <Trophy />
          Tier thresholds
        </Button>
        <Button
          variant={section === "players" ? "default" : "outline"}
          aria-pressed={section === "players"}
          onClick={() => setSection("players")}
        >
          <Users />
          Player XP
        </Button>
      </div>
      {settings.isPending ? (
        <p role="status" className="p-10 text-center">
          Loading loyalty settings...
        </p>
      ) : settings.error ? (
        <LoadError
          error={settings.error}
          onRetry={() => void settings.refetch()}
        />
      ) : section === "tiers" ? (
        <ThresholdForm
          key={settings.data.version}
          settings={settings.data}
          reload={() => void settings.refetch()}
        />
      ) : (
        <PlayersPanel settings={settings.data} />
      )}
    </div>
  );
}
