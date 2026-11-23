"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, RefreshCw, Link2, ExternalLink } from "lucide-react";
import { managementRequest, formatDate } from "@/lib/management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { EditorModal, LoadError, StatusLabel, Pager } from "./common";

interface OfferInput {
  merchant: string;
  title: string;
  description: string;
  destinationUrl: string;
  imageUrl: string;
  published: boolean;
  sortOrder: number;
}
interface Offer extends OfferInput {
  id: string;
  affiliateUrl: string | null;
  checkedAt: string | null;
  updatedAt: string;
  version: number;
}
interface OffersPage {
  items: Offer[];
  total: number;
  page: number;
  perPage: number;
  sovrnConfigured: boolean;
}
const empty: OfferInput = {
  merchant: "",
  title: "",
  description: "",
  destinationUrl: "",
  imageUrl: "",
  published: false,
  sortOrder: 0,
};

function OfferEditor({
  offer,
  onClose,
  configured,
}: {
  offer: Offer | null;
  onClose: () => void;
  configured: boolean;
}) {
  const client = useQueryClient();
  const [input, setInput] = useState<OfferInput>(
    offer
      ? {
          merchant: offer.merchant,
          title: offer.title,
          description: offer.description,
          destinationUrl: offer.destinationUrl,
          imageUrl: offer.imageUrl,
          published: offer.published,
          sortOrder: offer.sortOrder,
        }
      : empty
  );
  const check = useMutation({
    mutationFn: () =>
      managementRequest<{ affiliatable: boolean }>(
        "partner-offers/check",
        { destinationUrl: input.destinationUrl },
        "POST"
      ),
  });
  const save = useMutation({
    mutationFn: () =>
      managementRequest(
        offer ? "partner-offers/" + offer.id : "partner-offers",
        offer ? { ...input, expectedVersion: offer.version } : input,
        offer ? "PATCH" : "POST"
      ),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["partner-offers"] });
      toast.success(
        input.published
          ? "Partner offer published"
          : "Partner offer saved as draft"
      );
      onClose();
    },
  });
  const busy = check.isPending || save.isPending;
  const change = <K extends keyof OfferInput>(key: K, value: OfferInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
    if (key === "destinationUrl") check.reset();
    save.reset();
  };
  return (
    <EditorModal
      title={offer ? "Edit partner offer" : "Add partner offer"}
      busy={busy}
      onClose={onClose}
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <fieldset className="space-y-4" disabled={busy}>
          <label className="block space-y-2 text-sm font-medium">
            Merchant
            <Input
              value={input.merchant}
              required
              maxLength={100}
              onChange={(event) => change("merchant", event.target.value)}
              placeholder="Merchant name"
            />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            Offer title
            <Input
              value={input.title}
              required
              maxLength={160}
              onChange={(event) => change("title", event.target.value)}
              placeholder="Title shown in the portal"
            />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            Merchant destination URL
            <Input
              type="url"
              value={input.destinationUrl}
              required
              maxLength={2048}
              onChange={(event) => change("destinationUrl", event.target.value)}
              placeholder="https://www.merchant.com/product"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Use the original merchant URL. Sovrn generates the tracked link when
            publishing.
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={!configured || !input.destinationUrl || busy}
            onClick={() => check.mutate()}
          >
            <Link2 /> {check.isPending ? "Checking..." : "Check destination"}
          </Button>
          {check.data && (
            <p role="status" className="rounded-lg bg-muted p-3 text-sm">
              {check.data.affiliatable
                ? "Sovrn can monetize this destination. Publishing will check it again."
                : "Sovrn cannot monetize this destination for your site. You can still save a draft."}
            </p>
          )}
          {check.error && (
            <p role="alert" className="text-sm text-destructive">
              {check.error.message}
            </p>
          )}
          <label className="block space-y-2 text-sm font-medium">
            Description (optional)
            <textarea
              className="min-h-24 w-full rounded-md border bg-transparent p-3 text-sm"
              value={input.description}
              maxLength={600}
              onChange={(event) => change("description", event.target.value)}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Offer text appears as entered. Portal buttons and affiliate
            disclosures follow the player’s language.
          </p>
          <label className="block space-y-2 text-sm font-medium">
            Image URL (optional)
            <Input
              type="url"
              value={input.imageUrl}
              maxLength={2048}
              onChange={(event) => change("imageUrl", event.target.value)}
              placeholder="https://..."
            />
          </label>
          <label className="block space-y-2 text-sm font-medium">
            Display order
            <Input
              type="number"
              value={input.sortOrder}
              required
              min={0}
              max={10000}
              step={1}
              onChange={(event) =>
                change("sortOrder", Number(event.target.value))
              }
            />
          </label>
          <label className="flex items-center gap-3 rounded-lg border p-4 text-sm font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 accent-blue-600"
              checked={input.published}
              onChange={(event) => change("published", event.target.checked)}
            />
            Publish on the portal
          </label>
          <p className="text-xs text-muted-foreground">
            Uncheck to remove the offer from the portal. Lower display orders
            appear first.
          </p>
        </fieldset>
        {!configured && (
          <p className="rounded-lg bg-amber-500/10 p-3 text-sm">
            Set SOVRN_API_KEY in the admin backend .env to check destinations or
            publish new offers. Drafts and unpublishing remain available.
          </p>
        )}
        {offer && (
          <p className="text-xs text-muted-foreground">
            Last verified: {formatDate(offer.checkedAt)}
          </p>
        )}
        {save.error && (
          <p role="alert" className="text-sm text-destructive">
            {save.error.message}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button disabled={busy}>
            {save.isPending ? "Saving..." : "Save offer"}
          </Button>
        </div>
      </form>
    </EditorModal>
  );
}

export default function PartnerOffersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Offer | "new" | null>(null);
  const query = useQuery({
    queryKey: ["partner-offers", search, status, page],
    queryFn: () =>
      managementRequest<OffersPage>(
        "partner-offers?" +
          new URLSearchParams({ search, status, page: String(page) })
      ),
    retry: false,
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Partner Offers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the affiliate offers shown on your portal’s Promotions page.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw />
            Refresh
          </Button>
          <Button disabled={!query.data} onClick={() => setEditing("new")}>
            <Plus />
            Add offer
          </Button>
        </div>
      </div>
      {query.data && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4 text-sm">
          <StatusLabel positive={query.data.sovrnConfigured}>
            {query.data.sovrnConfigured
              ? "Sovrn API key configured"
              : "Sovrn API key missing"}
          </StatusLabel>
          <span className="text-muted-foreground">
            Published offers appear in the portal; drafts stay private.
          </span>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-md"
          aria-label="Search partner offers"
          placeholder="Search merchant or title..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label="Publication status"
          className="rounded-md border bg-background px-3 text-sm"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All offers</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
      </div>
      {query.isPending ? (
        <p role="status">Loading partner offers...</p>
      ) : query.error ? (
        <LoadError error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  {["Offer", "Status", "Order", "Updated", "Actions"].map(
                    (label) => (
                      <th key={label} className="p-4 font-medium">
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((offer) => (
                  <tr key={offer.id} className="border-b last:border-b-0">
                    <td className="min-w-52 p-4">
                      <p className="font-medium">{offer.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {offer.merchant}
                      </p>
                    </td>
                    <td className="p-4">
                      <StatusLabel positive={offer.published}>
                        {offer.published ? "Published" : "Draft"}
                      </StatusLabel>
                    </td>
                    <td className="p-4">{offer.sortOrder}</td>
                    <td className="whitespace-nowrap p-4 text-xs">
                      {formatDate(offer.updatedAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditing(offer)}
                          aria-label={"Edit " + offer.title}
                        >
                          <Pencil />
                          Edit
                        </Button>
                        {offer.affiliateUrl && (
                          <a
                            href={offer.affiliateUrl}
                            target="_blank"
                            rel="sponsored noopener"
                            aria-label={"Open " + offer.title + " in a new tab"}
                            className="text-primary"
                          >
                            <ExternalLink size={17} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {query.data.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-10 text-center text-muted-foreground"
                    >
                      No offers found. Add an offer or adjust your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pager
            page={page}
            total={query.data.total}
            perPage={query.data.perPage}
            pending={query.isFetching}
            onChange={setPage}
          />
        </div>
      )}
      {editing && (
        <OfferEditor
          key={editing === "new" ? "new" : editing.id}
          offer={editing === "new" ? null : editing}
          configured={query.data?.sovrnConfigured ?? false}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
