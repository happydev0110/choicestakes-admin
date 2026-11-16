"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Search, RefreshCw, Pencil } from "lucide-react";
import {
  managementRequest,
  formatDate,
  type PlayerDetails,
  type Player,
  type Page,
} from "@/lib/management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function PlayerForm({
  player,
  close,
  busy,
}: {
  player: PlayerDetails;
  close: () => void;
  busy: (value: boolean) => void;
}) {
  const client = useQueryClient(),
    [displayName, setName] = useState(player.displayName),
    [status, setStatus] = useState(player.status);
  const mutation = useMutation({
    mutationFn: () =>
      managementRequest("players/" + player.id, {
        displayName,
        status,
        expected: { displayName: player.displayName, status: player.status },
      }),
    onMutate: () => busy(true),
    onSettled: () => busy(false),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["players"] });
      toast.success("Player updated");
      close();
    },
  });
  const editable = ["active", "suspended"].includes(player.status);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="space-y-5"
    >
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="break-all font-medium">{player.email}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Player ID</dt>
          <dd className="break-all font-mono text-xs">{player.id}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Joined</dt>
          <dd>{formatDate(player.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Email verification</dt>
          <dd>{player.emailVerified ? "Verified" : "Unverified"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Active sessions</dt>
          <dd>{player.activeSessions}</dd>
        </div>
      </dl>
      <div className="space-y-2">
        <Label htmlFor="player-name">Display name</Label>
        <Input
          id="player-name"
          minLength={2}
          maxLength={30}
          required
          value={displayName}
          disabled={mutation.isPending || !editable}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="player-status">Account status</Label>
        <Select
          id="player-status"
          value={status}
          disabled={mutation.isPending || !editable}
          onChange={(e) => setStatus(e.target.value)}
        >
          {!editable && <option value={status}>{status}</option>}
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Select>
      </div>
      {status === "suspended" && (
        <p className="rounded-lg bg-amber-500/10 p-3 text-sm">
          Suspending this player signs them out and blocks login and new game
          activity. Existing wins and refunds can still settle.
        </p>
      )}
      {!editable && (
        <p className="text-sm text-muted-foreground">
          This account has a restricted status and cannot be edited here.
        </p>
      )}
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
        <Button
          disabled={
            mutation.isPending ||
            !editable ||
            (displayName === player.displayName && status === player.status)
          }
        >
          {mutation.isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
function PlayerEditor({ id, onClose }: { id: string; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: ["player", id],
    queryFn: () => managementRequest<PlayerDetails>("players/" + id),
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  return (
    <EditorModal title="Player details" busy={busy} onClose={onClose}>
      {query.isPending ? (
        <p role="status">Loading player...</p>
      ) : query.error ? (
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <PlayerForm player={query.data} close={onClose} busy={setBusy} />
      )}
    </EditorModal>
  );
}
export default function PlayersPage() {
  const [draft, setDraft] = useState(""),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["players", search, status, page],
    queryFn: () =>
      managementRequest<Page<Player>>(
        "players?" + new URLSearchParams({ search, status, page: String(page) })
      ),
    retry: false,
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Users className="h-7 w-7 text-primary" />
            User management
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage player accounts and access to your platform.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw className={query.isFetching ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(draft.trim());
          setPage(1);
        }}
        className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4"
      >
        <Input
          aria-label="Search players"
          className="min-w-48 flex-1"
          placeholder="Search by name, email, or player ID"
          maxLength={100}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Select
          aria-label="Filter player status"
          className="w-full sm:w-44"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Select>
        <Button>
          <Search />
          Search
        </Button>
      </form>
      {query.isPending ? (
        <div
          role="status"
          className="rounded-xl border bg-card p-12 text-center"
        >
          Loading players...
        </div>
      ) : query.error ? (
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          {query.data.items.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      <p className="font-medium">{player.displayName}</p>
                      <p
                        className="max-w-56 truncate text-xs text-muted-foreground"
                        title={player.id}
                      >
                        {player.id}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusLabel positive={player.status === "active"}>
                        {player.status}
                      </StatusLabel>
                    </TableCell>
                    <TableCell>
                      <p>{player.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.emailVerified ? "Verified" : "Unverified"}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(player.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelected(player.id)}
                        aria-label={"Manage " + player.displayName}
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
              <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <h2 className="font-semibold">No players found</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {search || status
                  ? "Try changing the search or status filter."
                  : "Registered players will appear here."}
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
        <PlayerEditor
          key={selected}
          id={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
