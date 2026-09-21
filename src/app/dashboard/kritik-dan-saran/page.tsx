"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  CheckCircle2,
  HelpCircle,
  Loader2,
  MessageCircle,
  MessagesSquare,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Star,
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { createFeedback, getFeedbacks } from "@/lib/apiClient";
import { getAxiosErrorMessage } from "@/lib/apiError";
import { normalizeFeedbacksList } from "@/lib/feedbacks";
import { cn } from "@/lib/utils";
import type { FeedbackRating, FeedbackRecord } from "@/types/feedback";

const RATING_OPTIONS: {
  value: FeedbackRating;
  label: string;
  emoji: string;
}[] = [
  { value: 1, label: "Jelek", emoji: "😡" },
  { value: 2, label: "Kurang", emoji: "😕" },
  { value: 3, label: "Oke", emoji: "😐" },
  { value: 4, label: "Baik", emoji: "🙂" },
  { value: 5, label: "Keren", emoji: "😎" },
];

/** Sesuai POST /api/admin/feedbacks */
const COMMENT_MIN = 20;
const COMMENT_MAX = 500;

function ratingLabel(n: number | undefined): string {
  const o = RATING_OPTIONS.find((r) => r.value === n);
  return o ? `${o.emoji} ${o.label}` : "—";
}

const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";
const labelCls = "text-sm font-medium text-slate-800";
const headCls = "h-11 text-xs font-semibold text-slate-500";

function RatingStars({ value }: { value: number | undefined }) {
  const n = typeof value === "number" ? value : 0;
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`Rating ${n} dari 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i <= n
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-slate-300"
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}

/** "17 Apr 2026, 14:22" */
function DateCell({ value }: { value: string | undefined | null }) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) {
    return <span className="text-slate-400">—</span>;
  }
  const date = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <span className="text-slate-900">
      {date}, {time.replace(".", ":")}
    </span>
  );
}

/** Jangan menampilkan SQL mentah ke pengguna */
function humanizeFeedbackListError(message: string): string {
  if (
    /SQLSTATE|Base table or view not found|doesn't exist/i.test(message)
  ) {
    return "Daftar feedback tidak dapat dimuat: data di server belum siap (misalnya tabel feedback belum dibuat). Silakan jalankan migrasi database di backend atau hubungi administrator.";
  }
  return message;
}

export default function KritikDanSaranPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const canCreate = hasPermission("feedbacks.create");
  const canIndex = hasPermission("feedbacks.index");

  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [sentSummary, setSentSummary] = useState<{
    rating: FeedbackRating;
    comment: string;
  } | null>(null);

  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [items, setItems] = useState<FeedbackRecord[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  /** LIKE pada kolom comment */
  const [filterCommentSearch, setFilterCommentSearch] = useState("");
  const [filterRating, setFilterRating] = useState<string>("all");
  /** LIKE nama, email, atau WhatsApp */
  const [filterUserSearch, setFilterUserSearch] = useState("");

  const adminFiltersRef = useRef({
    search: filterCommentSearch,
    rating: filterRating,
    userSearch: filterUserSearch,
  });
  adminFiltersRef.current = {
    search: filterCommentSearch,
    rating: filterRating,
    userSearch: filterUserSearch,
  };

  const commentTrimLen = comment.trim().length;

  const loadList = useCallback(
    async (opts?: {
      targetPage?: number;
      filters?: {
        search: string;
        rating: string;
        userSearch: string;
      };
    }) => {
      if (!canIndex) return;
      const pageToUse = opts?.targetPage ?? page;
      const f = opts?.filters ?? adminFiltersRef.current;
      setListLoading(true);
      setListError(null);
      try {
        const params: Record<string, string | number> = {
          page: pageToUse,
          per_page: perPage,
        };
        if (f.rating !== "all") params.rating = Number(f.rating);
        if (f.search.trim()) params.search = f.search.trim();
        if (f.userSearch.trim()) params.user_search = f.userSearch.trim();

        const raw = await getFeedbacks(params);
        const n = normalizeFeedbacksList(raw);
        setItems(n.items);
        setLastPage(n.lastPage);
        setTotal(n.total);
        setPage(n.currentPage);
      } catch (e) {
        const raw =
          e instanceof AxiosError
            ? getAxiosErrorMessage(e, "Gagal memuat daftar kritik & saran.")
            : "Gagal memuat daftar kritik & saran.";
        const msg = humanizeFeedbackListError(raw);
        setListError(msg);
        setItems([]);
        toast.error(msg);
      } finally {
        setListLoading(false);
      }
    },
    [canIndex, page, perPage]
  );

  useEffect(() => {
    if (!authLoading && canIndex) {
      void loadList({ targetPage: page });
    }
  }, [authLoading, canIndex, loadList, page]);

  const applyAdminFilters = () => {
    setPage(1);
    void loadList({ targetPage: 1 });
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setPage(1);
  };

  const resetAdminFilters = () => {
    setFilterCommentSearch("");
    setFilterRating("all");
    setFilterUserSearch("");
    setPage(1);
    void loadList({
      targetPage: 1,
      filters: {
        search: "",
        rating: "all",
        userSearch: "",
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    if (rating == null) {
      toast.error("Pilih penilaian (1–5).");
      return;
    }
    const t = comment.trim();
    if (!t) {
      toast.error("Isi kolom komentar.");
      return;
    }
    if (t.length < COMMENT_MIN) {
      toast.error(
        `Komentar minimal ${COMMENT_MIN} karakter (setelah di-trim). Sekarang ${t.length} karakter.`
      );
      return;
    }
    if (t.length > COMMENT_MAX) {
      toast.error(`Komentar maksimal ${COMMENT_MAX} karakter.`);
      return;
    }
    setSubmitting(true);
    try {
      await createFeedback({ rating, comment: t });
      setSentSummary({ rating, comment: t });
      setSuccessDialogOpen(true);
      setComment("");
      setRating(null);
      if (canIndex) void loadList({ targetPage: page });
    } catch (err) {
      toast.error(
        err instanceof AxiosError
          ? getAxiosErrorMessage(err, "Gagal mengirim kritik & saran.")
          : "Gagal mengirim kritik & saran."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="flex min-h-[40vh] items-center justify-center gap-2 p-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span>Memuat…</span>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!canCreate && !canIndex) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <div className="flex w-full items-center justify-between">
            <div className="flex-1">
              <SiteHeader />
            </div>
            <TopNav />
          </div>
          <div className="bg-blue-50/80 p-6">
            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Akses ditolak
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Anda tidak memiliki izin untuk halaman ini (
                <span className="font-mono text-xs">
                  feedbacks.create / feedbacks.index
                </span>
                ).
              </p>
            </section>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex w-full items-center justify-between">
          <div className="flex-1">
            <SiteHeader />
          </div>
          <TopNav />
        </div>

        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-12 md:p-6">
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "Kritik & Saran" },
            ]}
            icon={MessageCircle}
            title="Kritik & Saran"
            description="Beri penilaian dan komentar untuk membantu kami meningkatkan layanan."
            illustration="/images/rating.png"
            illustrationClassName="w-[120px]"
          />

          {canCreate ? (
            <SectionCard
              icon={HelpCircle}
              title="Kirim kritik & saran"
              description={`Pilih penilaian 1–5, lalu isi komentar minimal ${COMMENT_MIN} karakter (maks. ${COMMENT_MAX}). Yang dikirim ke server adalah teks setelah spasi di ujung dibuang.`}
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-slate-900">
                    Penilaian
                  </legend>
                  <div
                    className="flex flex-wrap gap-2"
                    role="radiogroup"
                    aria-label="Penilaian 1 sampai 5"
                  >
                    {RATING_OPTIONS.map((opt) => {
                      const selected = rating === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          className={cn(
                            "rounded-xl border px-4 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                            selected
                              ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600"
                              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                          )}
                          onClick={() => setRating(opt.value)}
                        >
                          <span aria-hidden>{opt.emoji}</span>{" "}
                          <span className="font-medium">{opt.label}</span>
                          <span className="ml-1 text-xs text-slate-500">
                            ({opt.value})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="feedback-comment" className={labelCls}>
                      Komentar
                    </Label>
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        commentTrimLen > COMMENT_MAX
                          ? "font-medium text-destructive"
                          : commentTrimLen > 0 && commentTrimLen < COMMENT_MIN
                            ? "font-medium text-amber-600"
                            : "text-slate-500"
                      )}
                    >
                      {comment.length}/{COMMENT_MAX}
                      {commentTrimLen < COMMENT_MIN ? (
                        <span className="text-slate-500">
                          {" "}
                          (min {COMMENT_MIN} setelah trim: {commentTrimLen})
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <Textarea
                    id="feedback-comment"
                    value={comment}
                    onChange={(e) =>
                      setComment(e.target.value.slice(0, COMMENT_MAX))
                    }
                    placeholder="Ceritakan pengalaman atau saran Anda…"
                    rows={5}
                    className="min-h-[120px] resize-y rounded-lg border-slate-200 bg-white"
                    maxLength={COMMENT_MAX}
                    aria-invalid={
                      (commentTrimLen > 0 && commentTrimLen < COMMENT_MIN) ||
                      comment.length > COMMENT_MAX
                    }
                  />
                </div>

                <Button
                  type="submit"
                  className="h-11 gap-2 rounded-lg bg-blue-600 px-6 text-white hover:bg-blue-700"
                  disabled={
                    submitting ||
                    rating == null ||
                    commentTrimLen < COMMENT_MIN ||
                    commentTrimLen > COMMENT_MAX
                  }
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Mengirim…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Kirim
                    </>
                  )}
                </Button>
              </form>
            </SectionCard>
          ) : null}

          {canIndex ? (
            <SectionCard
              icon={MessagesSquare}
              title="Masukan pengguna"
              description={
                total > 0
                  ? `${total} entri`
                  : listLoading
                    ? "Memuat…"
                    : "Belum ada data"
              }
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => void loadList()}
                  disabled={listLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${listLoading ? "animate-spin" : ""}`}
                    aria-hidden
                  />
                  Muat ulang
                </Button>
              }
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="fb-comment-search" className={labelCls}>
                      Cari dalam komentar
                    </Label>
                    <Input
                      id="fb-comment-search"
                      placeholder="Kata dalam isi komentar…"
                      value={filterCommentSearch}
                      onChange={(e) => setFilterCommentSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyAdminFilters();
                        }
                      }}
                      aria-describedby="fb-filter-hint"
                      className={fieldCls}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fb-user-search" className={labelCls}>
                      Cari pengguna
                    </Label>
                    <Input
                      id="fb-user-search"
                      placeholder="Nama, email, atau WhatsApp…"
                      value={filterUserSearch}
                      onChange={(e) => setFilterUserSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyAdminFilters();
                        }
                      }}
                      aria-describedby="fb-filter-hint"
                      className={fieldCls}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={labelCls}>Rating</Label>
                    <Select
                      value={filterRating}
                      onValueChange={setFilterRating}
                    >
                      <SelectTrigger
                        aria-label="Filter rating"
                        className={fieldCls}
                      >
                        <SelectValue placeholder="Semua" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua rating</SelectItem>
                        {RATING_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={String(o.value)}>
                            {o.emoji} {o.label} ({o.value})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p id="fb-filter-hint" className="text-xs text-slate-500">
                  <span className="font-medium">Cari dalam komentar</span>{" "}
                  menyaring teks di isi masukan.{" "}
                  <span className="font-medium">Cari pengguna</span> menyaring
                  nama, email, atau WhatsApp.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
                    onClick={applyAdminFilters}
                  >
                    <Search className="h-4 w-4" aria-hidden />
                    Terapkan filter
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 gap-2 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    onClick={resetAdminFilters}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    Reset
                  </Button>
                </div>

                {listError && !listLoading ? (
                  <p className="text-center text-sm text-red-600" role="alert">
                    {listError}
                  </p>
                ) : listLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-500">
                    Belum ada kritik & saran.
                  </div>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto md:block">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className={`${headCls} w-14`}>
                              No
                            </TableHead>
                            <TableHead className={headCls}>Komentar</TableHead>
                            <TableHead className={headCls}>Pengguna</TableHead>
                            <TableHead className={headCls}>Rating</TableHead>
                            <TableHead className={headCls}>Tanggal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((row, index) => (
                            <TableRow
                              key={row.id ?? `${row.user_id}-${row.created_at}`}
                              className="border-slate-100 hover:bg-slate-50/60"
                            >
                              <TableCell className="py-4 text-sm text-slate-700">
                                {(page - 1) * perPage + index + 1}
                              </TableCell>
                              <TableCell className="max-w-md py-4 text-sm text-slate-900">
                                <p className="whitespace-pre-wrap break-words">
                                  {row.comment ?? "—"}
                                </p>
                              </TableCell>
                              <TableCell className="max-w-[200px] py-4 text-sm">
                                <p className="font-medium text-slate-900">
                                  {row.user?.name ?? "—"}
                                </p>
                                {row.user?.email ? (
                                  <p className="truncate text-xs text-slate-500">
                                    {row.user.email}
                                  </p>
                                ) : null}
                              </TableCell>
                              <TableCell className="whitespace-nowrap py-4">
                                <RatingStars value={row.rating} />
                              </TableCell>
                              <TableCell className="whitespace-nowrap py-4 text-sm">
                                <DateCell value={row.created_at} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <ul className="flex flex-col gap-3 md:hidden">
                      {items.map((row) => (
                        <li
                          key={row.id ?? `${row.user_id}-${row.created_at}`}
                          className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs text-slate-500">
                              #{row.id ?? "—"}
                            </span>
                            <RatingStars value={row.rating} />
                          </div>
                          {row.user?.name ? (
                            <p className="mt-1 text-sm font-medium text-slate-900">
                              {row.user.name}
                            </p>
                          ) : null}
                          {row.user?.email ? (
                            <p className="text-xs text-slate-500">
                              {row.user.email}
                            </p>
                          ) : null}
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-800">
                            {row.comment ?? "—"}
                          </p>
                          <div className="mt-2 text-xs">
                            <DateCell value={row.created_at} />
                          </div>
                        </li>
                      ))}
                    </ul>

                    <NumberedPagination
                      page={page}
                      lastPage={lastPage}
                      total={total}
                      perPage={perPage}
                      disabled={listLoading}
                      onPageChange={setPage}
                      onPerPageChange={handlePerPageChange}
                    />
                  </>
                )}
              </div>
            </SectionCard>
          ) : null}
        </div>

        <Dialog
          open={successDialogOpen}
          onOpenChange={(open) => {
            setSuccessDialogOpen(open);
            if (!open) setSentSummary(null);
          }}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-md">
            <DialogHeader>
              <div className="flex flex-col items-center gap-2">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
                  aria-hidden
                >
                  <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
                </span>
                <DialogTitle className="text-center">
                  Kritik & saran terkirim
                </DialogTitle>
              </div>
              <DialogDescription className="text-center">
                Terima kasih atas masukan Anda. Tim kami akan mempertimbangkan
                untuk peningkatan layanan.
              </DialogDescription>
            </DialogHeader>

            {sentSummary ? (
              <div
                className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm"
                role="region"
                aria-label="Ringkasan yang dikirim"
              >
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Penilaian
                  </p>
                  <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                    {ratingLabel(sentSummary.rating)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Komentar
                  </p>
                  <div className="mt-1 max-h-[min(40vh,16rem)] overflow-y-auto rounded-md border border-slate-200/80 bg-white p-2 dark:border-slate-600 dark:bg-slate-950/50">
                    <p className="whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200">
                      {sentSummary.comment}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                className="h-10 w-full rounded-lg bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                onClick={() => setSuccessDialogOpen(false)}
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
