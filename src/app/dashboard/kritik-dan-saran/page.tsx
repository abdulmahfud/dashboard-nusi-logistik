"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  CheckCircle2,
  HelpCircle,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { formatDateIdLong } from "@/lib/date";
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
  const [perPage] = useState(15);
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
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Akses ditolak</CardTitle>
                <CardDescription>
                  Anda tidak memiliki izin untuk halaman ini (
                  <span className="font-mono text-xs">
                    feedbacks.create / feedbacks.index
                  </span>
                  ).
                </CardDescription>
              </CardHeader>
            </Card>
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
          <div className="flex items-start gap-3">
            <MessageCircle className="mt-0.5 h-8 w-8 shrink-0 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Kritik & Saran
              </h1>
              <p className="text-muted-foreground text-sm">
                Beri penilaian dan komentar untuk membantu kami meningkatkan
                layanan.
              </p>
            </div>
          </div>

          {canCreate ? (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HelpCircle className="h-5 w-5" aria-hidden />
                  Kirim kritik & saran
                </CardTitle>
                <CardDescription>
                  Pilih penilaian 1–5, lalu isi komentar minimal {COMMENT_MIN}{" "}
                  karakter (maks. {COMMENT_MAX}). Yang dikirim ke server adalah
                  teks setelah spasi di ujung dibuang.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                              "rounded-lg border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                              selected
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                            )}
                            onClick={() => setRating(opt.value)}
                          >
                            <span aria-hidden>{opt.emoji}</span>{" "}
                            <span className="font-medium">{opt.label}</span>
                            <span className="text-muted-foreground ml-1 text-xs">
                              ({opt.value})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="feedback-comment">Komentar</Label>
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          commentTrimLen > COMMENT_MAX
                            ? "font-medium text-destructive"
                            : commentTrimLen > 0 && commentTrimLen < COMMENT_MIN
                              ? "font-medium text-amber-600 dark:text-amber-500"
                              : "text-muted-foreground"
                        )}
                      >
                        {comment.length}/{COMMENT_MAX}
                        {commentTrimLen < COMMENT_MIN ? (
                          <span className="text-muted-foreground">
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
                        setComment(
                          e.target.value.slice(0, COMMENT_MAX)
                        )
                      }
                      placeholder="Ceritakan pengalaman atau saran Anda…"
                      rows={5}
                      className="min-h-[120px] resize-y"
                      maxLength={COMMENT_MAX}
                      aria-invalid={
                        (commentTrimLen > 0 && commentTrimLen < COMMENT_MIN) ||
                        comment.length > COMMENT_MAX
                      }
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="blueGradient"
                    className="gap-2"
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
              </CardContent>
            </Card>
          ) : null}

          {canIndex ? (
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="text-lg">Masukan pengguna</CardTitle>
                  <CardDescription>
                    {total > 0
                      ? `${total} entri`
                      : listLoading
                        ? "Memuat…"
                        : "Belum ada data"}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="blueGradientOutline"
                  size="sm"
                  onClick={() => void loadList()}
                  disabled={listLoading}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${listLoading ? "animate-spin" : ""}`}
                  />
                  Muat ulang
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="fb-comment-search">Cari dalam komentar</Label>
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fb-user-search">Cari pengguna</Label>
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <Select
                      value={filterRating}
                      onValueChange={setFilterRating}
                    >
                      <SelectTrigger aria-label="Filter rating">
                        <SelectValue placeholder="Semua" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua rating</SelectItem>
                        {RATING_OPTIONS.map((o) => (
                          <SelectItem
                            key={o.value}
                            value={String(o.value)}
                          >
                            {o.emoji} {o.label} ({o.value})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p
                  id="fb-filter-hint"
                  className="text-muted-foreground text-xs"
                >
                  <span className="font-medium">Cari dalam komentar</span>{" "}
                  menyaring teks di isi masukan.{" "}
                  <span className="font-medium">Cari pengguna</span> menyaring
                  nama, email, atau WhatsApp.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="blueGradient"
                    onClick={applyAdminFilters}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Terapkan filter
                  </Button>
                  <Button
                    type="button"
                    variant="blueGradientOutline"
                    onClick={resetAdminFilters}
                  >
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
                  <div className="text-muted-foreground py-12 text-center text-sm">
                    Belum ada kritik & saran.
                  </div>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto rounded-md border md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[72px]">ID</TableHead>
                            <TableHead>Pengguna</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Komentar</TableHead>
                            <TableHead className="whitespace-nowrap">
                              Tanggal
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((row) => (
                            <TableRow key={row.id ?? `${row.user_id}-${row.created_at}`}>
                              <TableCell className="font-mono text-sm">
                                {row.id ?? "—"}
                              </TableCell>
                              <TableCell className="max-w-[160px] text-sm">
                                {row.user?.name ?? "—"}
                                {row.user?.email ? (
                                  <div className="text-muted-foreground truncate text-xs">
                                    {row.user.email}
                                  </div>
                                ) : null}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm">
                                {ratingLabel(row.rating)}
                              </TableCell>
                              <TableCell className="max-w-md text-sm">
                                <p className="whitespace-pre-wrap break-words">
                                  {row.comment ?? "—"}
                                </p>
                              </TableCell>
                              <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                                {formatDateIdLong(row.created_at)}
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
                          className="rounded-lg border bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              #{row.id ?? "—"}
                            </span>
                            <span className="text-sm">
                              {ratingLabel(row.rating)}
                            </span>
                          </div>
                          {row.user?.name ? (
                            <p className="mt-1 text-sm font-medium text-slate-900">
                              {row.user.name}
                            </p>
                          ) : null}
                          {row.user?.email ? (
                            <p className="text-muted-foreground text-xs">
                              {row.user.email}
                            </p>
                          ) : null}
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-800">
                            {row.comment ?? "—"}
                          </p>
                          <p className="text-muted-foreground mt-2 text-xs">
                            {formatDateIdLong(row.created_at)}
                          </p>
                        </li>
                      ))}
                    </ul>

                    {lastPage > 1 ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        <p className="text-muted-foreground text-sm">
                          Halaman {page} dari {lastPage}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="blueGradientOutline"
                            size="sm"
                            disabled={page <= 1 || listLoading}
                            onClick={() =>
                              setPage((p) => Math.max(1, p - 1))
                            }
                          >
                            Sebelumnya
                          </Button>
                          <Button
                            type="button"
                            variant="blueGradientOutline"
                            size="sm"
                            disabled={page >= lastPage || listLoading}
                            onClick={() =>
                              setPage((p) => Math.min(lastPage, p + 1))
                            }
                          >
                            Berikutnya
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <Dialog
          open={successDialogOpen}
          onOpenChange={(open) => {
            setSuccessDialogOpen(open);
            if (!open) setSentSummary(null);
          }}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <div className="flex flex-col items-center gap-2 sm:items-start">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                  aria-hidden
                >
                  <CheckCircle2 className="h-7 w-7" strokeWidth={2} />
                </span>
                <DialogTitle className="text-center sm:text-left">
                  Kritik & saran terkirim
                </DialogTitle>
              </div>
              <DialogDescription className="text-center sm:text-left">
                Terima kasih atas masukan Anda. Tim kami akan mempertimbangkan
                untuk peningkatan layanan.
              </DialogDescription>
            </DialogHeader>

            {sentSummary ? (
              <div
                className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/40"
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
                variant="blueGradient"
                className="w-full sm:w-auto"
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
