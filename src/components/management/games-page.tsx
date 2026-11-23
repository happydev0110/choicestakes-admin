"use client";
import Image from "next/image";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gamepad2, Search, RefreshCw, Pencil, Eye, EyeOff } from "lucide-react";
import {
  managementRequest,
  formatDate,
  categoryNames,
  type Game,
  type GamePage,
} from "@/lib/management";
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
import { toast } from "@/lib/toast";
import { EditorModal, LoadError, StatusLabel, Pager } from "./common";

function Artwork({ game }: { game: Game }) {
  const [failed, setFailed] = useState(false);
  return game.imageUrl && !failed ? (
    <Image
      unoptimized
      src={game.imageUrl}
      alt=""
      width={44}
      height={60}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-[60px] w-11 shrink-0 rounded-md object-cover"
    />
  ) : (
    <div className="flex h-[60px] w-11 shrink-0 items-center justify-center rounded-md bg-muted">
      <Gamepad2 className="text-muted-foreground" />
    </div>
  );
}
function GameForm({
  game,
  close,
  busy,
}: {
  game: Game;
  close: () => void;
  busy: (value: boolean) => void;
}) {
  const client = useQueryClient(),
    [visible, setVisible] = useState(game.visible),
    [assigned, setAssigned] = useState(game.categories);
  const mutation = useMutation({
    mutationFn: () =>
      managementRequest("games/" + game.uuid, {
        visible,
        categories: assigned,
        expected: { visible: game.visible, categories: game.categories },
      }),
    onMutate: () => busy(true),
    onSettled: () => busy(false),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["games"] });
      toast.success("Game updated");
      close();
    },
  });
  const unchanged =
    visible === game.visible &&
    JSON.stringify([...assigned].sort()) ===
      JSON.stringify([...game.categories].sort());
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
      className="space-y-5"
    >
      <div className="flex items-center gap-4">
        <Artwork game={game} />
        <div>
          <h3 className="text-lg font-semibold">{game.name}</h3>
          <p className="text-sm text-muted-foreground">
            {game.provider} · {game.currency}
          </p>
        </div>
      </div>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Game ID</dt>
          <dd className="break-all font-mono text-xs">{game.uuid}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Provider code / vendor</dt>
          <dd className="break-all">
            {game.code} / {game.vendor}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Last imported</dt>
          <dd>{formatDate(game.syncedAt)}</dd>
        </div>
      </dl>
      <div className="rounded-lg border p-4">
        <label className="flex cursor-pointer items-center justify-between gap-4 font-medium">
          Show in portal
          <input
            type="checkbox"
            className="h-4 w-4 accent-blue-600"
            checked={visible}
            disabled={mutation.isPending}
            onChange={(event) => setVisible(event.target.checked)}
          />
        </label>
        <p className="mt-2 text-sm text-muted-foreground">
          Hidden games are removed from the catalog and cannot start new
          sessions. This setting survives provider imports.
        </p>
      </div>
      {!game.available && (
        <p className="rounded-lg bg-amber-500/10 p-3 text-sm">
          The provider currently marks this game unavailable. It will remain
          unavailable even when “Show in portal” is selected.
        </p>
      )}
      <fieldset disabled={mutation.isPending} className="space-y-3">
        <legend className="font-medium">Categories</legend>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(categoryNames).map(([value, label]) => (
            <label
              key={value}
              className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={assigned.includes(value)}
                className="h-4 w-4 accent-blue-600"
                onChange={(event) =>
                  setAssigned((current) =>
                    event.target.checked
                      ? [...current, value]
                      : current.filter((c) => c !== value)
                  )
                }
              />
              {label}
            </label>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Featured and New games are curated sections. With no categories
          selected, visible games still appear in All Games.
          {" "}A game can belong to several categories. Empty categories are hidden
          from the portal category menu until an available, visible game is assigned.
        </p>
      </fieldset>
      {mutation.error && (
        <p role="alert" className="text-sm text-destructive">
          {mutation.error.message}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={mutation.isPending}
          onClick={close}
        >
          Cancel
        </Button>
        <Button disabled={mutation.isPending || unchanged}>
          {mutation.isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
function GameEditor({ id, onClose }: { id: string; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: ["game", id],
    queryFn: () => managementRequest<Game>("games/" + id),
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  return (
    <EditorModal title="Manage game" busy={busy} onClose={onClose}>
      {query.isPending ? (
        <p role="status">Loading game...</p>
      ) : query.error ? (
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <GameForm game={query.data} close={onClose} busy={setBusy} />
      )}
    </EditorModal>
  );
}
export default function GamesPage() {
  const [draft, setDraft] = useState(""),
    [search, setSearch] = useState(""),
    [provider, setProvider] = useState(""),
    [category, setCategory] = useState(""),
    [availability, setAvailability] = useState(""),
    [visibility, setVisibility] = useState(""),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<string | null>(null);
  const query = useQuery({
    queryKey: [
      "games",
      search,
      provider,
      category,
      availability,
      visibility,
      page,
    ],
    queryFn: () =>
      managementRequest<GamePage>(
        "games?" +
          new URLSearchParams({
            search,
            provider,
            category,
            availability,
            visibility,
            page: String(page),
          })
      ),
    retry: false,
  });
  const filter =
    (setter: (value: string) => void) =>
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setter(event.target.value);
      setPage(1);
    };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Gamepad2 className="h-8 w-8 text-primary" />
            Games management
          </h1>
          <p className="mt-2 text-muted-foreground">
            Organize your provider catalog and control which games appear in the
            portal.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw className={query.isFetching ? "animate-spin" : ""} />
          Refresh list
        </Button>
      </div>
      {query.data && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 text-sm">
          <div>
            <span className="font-medium">
              Sandbox catalog · {query.data.currency}
            </span>
            <p className="mt-1 text-muted-foreground">
              Last successful import:{" "}
              {formatDate(query.data.sync?.lastSuccessAt)}
            </p>
          </div>
          <div className="text-right">
            <StatusLabel positive={query.data.sync?.status === "succeeded"}>
              {query.data.sync?.status === "succeeded"
                ? "Import successful"
                : (query.data.sync?.status ?? "Not imported")}
            </StatusLabel>
            {query.data.sync?.errorCode && (
              <p className="mt-1 text-xs text-destructive">
                {query.data.sync.errorCode}
              </p>
            )}
          </div>
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(draft.trim());
          setPage(1);
        }}
        className="space-y-3 rounded-xl border bg-card p-4"
      >
        <div className="flex gap-3">
          <Input
            aria-label="Search games"
            placeholder="Search by game name or ID"
            maxLength={100}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button>
            <Search />
            Search
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Select
            aria-label="Filter provider"
            value={provider}
            onChange={filter(setProvider)}
          >
            <option value="">All providers</option>
            {(query.data?.providers ?? (provider ? [provider] : [])).map(
              (value) => (
                <option key={value}>{value}</option>
              )
            )}
          </Select>
          <Select
            aria-label="Filter category"
            value={category}
            onChange={filter(setCategory)}
          >
            <option value="">All categories</option>
            {Object.entries(categoryNames).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Filter provider availability"
            value={availability}
            onChange={filter(setAvailability)}
          >
            <option value="">All provider statuses</option>
            <option value="available">Provider available</option>
            <option value="unavailable">Provider unavailable</option>
          </Select>
          <Select
            aria-label="Filter portal visibility"
            value={visibility}
            onChange={filter(setVisibility)}
          >
            <option value="">All visibility</option>
            <option value="visible">Visible in portal</option>
            <option value="hidden">Hidden in portal</option>
          </Select>
        </div>
      </form>
      {query.isPending ? (
        <div
          role="status"
          className="rounded-xl border bg-card p-12 text-center"
        >
          Loading games...
        </div>
      ) : query.error ? (
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          {query.data.items.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Game</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Portal</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.map((game) => (
                  <TableRow key={game.uuid}>
                    <TableCell>
                      <div className="flex min-w-48 items-center gap-3">
                        <Artwork game={game} />
                        <div>
                          <p className="font-medium">{game.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {game.vendor}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{game.provider}</TableCell>
                    <TableCell>
                      <div className="flex max-w-60 flex-wrap gap-1">
                        {game.categories.length ? (
                          game.categories.map((value) => (
                            <span
                              key={value}
                              className="rounded bg-muted px-2 py-1 text-xs"
                            >
                              {categoryNames[value] ?? value}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground">
                            Uncategorized
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusLabel positive={game.available}>
                        {game.available ? "Available" : "Unavailable"}
                      </StatusLabel>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 text-sm">
                        {game.visible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                        {game.visible ? "Visible" : "Hidden"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelected(game.uuid)}
                        aria-label={"Manage " + game.name}
                      >
                        <Pencil />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <Gamepad2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <h2 className="font-semibold">No games found</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {search || provider || category || availability || visibility
                  ? "Try changing the search or filters."
                  : "Run the provider catalog import in the platform backend to populate this list."}
              </p>
            </div>
          )}
          <Pager
            page={query.data.page}
            total={query.data.total}
            perPage={query.data.perPage}
            pending={query.isFetching}
            onChange={setPage}
          />
        </div>
      )}
      {selected && (
        <GameEditor
          key={selected}
          id={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
