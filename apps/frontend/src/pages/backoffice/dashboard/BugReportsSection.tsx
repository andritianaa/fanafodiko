import { useState } from "react";
import { createPortal } from "react-dom";
import {
  useBugReports,
  useUpdateBugReport,
} from "@/features/bugReport/api/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MonitorIcon,
  DeviceMobileIcon,
  BrowserIcon,
  ImageIcon,
  XIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { BugReport } from "@ext/schemas";

// ── Badge statut ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BugReport["status"] }) {
  if (status === "open")
    return (
      <Badge
        variant="outline"
        className="gap-1 text-amber-600 border-amber-300 bg-amber-50"
      >
        <ClockIcon size={11} /> Ouvert
      </Badge>
    );
  if (status === "resolved")
    return (
      <Badge
        variant="outline"
        className="gap-1 text-green-600 border-green-300 bg-green-50"
      >
        <CheckCircleIcon size={11} weight="fill" /> Résolu
      </Badge>
    );
  return (
    <Badge
      variant="outline"
      className="gap-1 text-red-500 border-red-300 bg-red-50"
    >
      <XCircleIcon size={11} weight="fill" /> Annulé
    </Badge>
  );
}

// ── Icône plateforme ──────────────────────────────────────────────────────────

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "web")
    return <MonitorIcon size={13} className="shrink-0 text-muted-foreground" />;
  return (
    <DeviceMobileIcon size={13} className="shrink-0 text-muted-foreground" />
  );
}

// ── Dialog résolution ─────────────────────────────────────────────────────────

function ResolveDialog({
  report,
  onClose,
}: {
  report: BugReport;
  onClose: () => void;
}) {
  const [action, setAction] = useState<"resolved" | "cancelled">("resolved");
  const [message, setMessage] = useState("");
  const [screenshotIdx, setScreenshotIdx] = useState<number | null>(null);
  const { mutate, isPending } = useUpdateBugReport();

  const handleSubmit = () => {
    if (!message.trim()) {
      toast.error("Un message est requis");
      return;
    }
    mutate(
      { id: report.id, data: { status: action, adminMessage: message.trim() } },
      {
        onSuccess: () => {
          toast.success(
            action === "resolved" ? "Signalement résolu" : "Signalement annulé",
          );
          onClose();
        },
        onError: () => toast.error("Erreur lors de la mise à jour"),
      },
    );
  };

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Traiter le signalement</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Description */}
            <div className="rounded-lg bg-muted/40 p-3 text-sm space-y-1">
              <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
                Description
              </p>
              <p className="leading-relaxed">{report.description}</p>
            </div>

            {/* Device info */}
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <PlatformIcon platform={report.deviceInfo.platform} />
                {report.deviceInfo.platform}
              </span>
              {report.deviceInfo.browser && (
                <span className="flex items-center gap-1">
                  <BrowserIcon size={12} />
                  {report.deviceInfo.browser} {report.deviceInfo.browserVersion}
                </span>
              )}
              {report.deviceInfo.os && <span>· {report.deviceInfo.os}</span>}
              {report.deviceInfo.osVersion && (
                <span>· v{report.deviceInfo.osVersion}</span>
              )}
              {report.deviceInfo.screenSize && (
                <span>· {report.deviceInfo.screenSize}</span>
              )}
            </div>

            {/* Screenshots */}
            {report.screenshots.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Captures d'écran
                </p>
                <div className="flex flex-wrap gap-2">
                  {report.screenshots.map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setScreenshotIdx(i)}
                      className="relative w-16 h-16 rounded-lg border overflow-hidden group hover:scale-105 transition-transform"
                    >
                      <img
                        src={url}
                        alt={`Capture ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <ImageIcon
                          size={14}
                          className="text-white opacity-0 group-hover:opacity-100"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action */}
            <div className="space-y-2">
              <Label>Action</Label>
              <Select
                value={action}
                onValueChange={(v) => setAction(v as "resolved" | "cancelled")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved">
                    ✅ Marquer comme résolu
                  </SelectItem>
                  <SelectItem value="cancelled">
                    ❌ Annuler (non reproductible / hors sujet)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>Message à l'utilisateur *</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  action === "resolved"
                    ? "Ex : Le problème a été identifié et corrigé dans la version 1.2.3…"
                    : "Ex : Nous n'avons pas pu reproduire ce problème…"
                }
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              loading={isPending}
              onClick={handleSubmit}
              variant={action === "cancelled" ? "destructive" : "default"}
            >
              {action === "resolved"
                ? "Résoudre & notifier"
                : "Annuler & notifier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox captures */}
      {screenshotIdx !== null &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
            onClick={() => setScreenshotIdx(null)}
          >
            <button
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/30 rounded-full p-2"
              onClick={() => setScreenshotIdx(null)}
            >
              <XIcon size={20} />
            </button>
            <img
              src={report.screenshots[screenshotIdx]}
              alt="Capture"
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </>
  );
}

// ── Section principale ────────────────────────────────────────────────────────

export default function BugReportsSection() {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "open" | "resolved" | "cancelled"
  >("open");
  const [selected, setSelected] = useState<BugReport | null>(null);
  const { data, isLoading } = useBugReports(statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Signalements de problèmes</h1>
          <p className="text-sm text-muted-foreground">
            {data?.total ?? 0} signalement{(data?.total ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="open">Ouverts</SelectItem>
            <SelectItem value="resolved">Résolus</SelectItem>
            <SelectItem value="cancelled">Annulés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}

          {!isLoading && data?.reports.length === 0 && (
            <div className="py-16 text-center text-muted-foreground text-sm">
              <CheckCircleIcon size={36} className="mx-auto mb-3 opacity-20" />
              Aucun signalement pour ce filtre.
            </div>
          )}

          {!isLoading && (data?.reports.length ?? 0) > 0 && (
            <div className="divide-y">
              {data!.reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={report.status} />
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <PlatformIcon platform={report.deviceInfo.platform} />
                        {report.deviceInfo.platform}
                        {report.deviceInfo.browser &&
                          ` · ${report.deviceInfo.browser}`}
                        {report.deviceInfo.os && ` · ${report.deviceInfo.os}`}
                        {report.deviceInfo.osVersion &&
                          ` ${report.deviceInfo.osVersion}`}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2">{report.description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{report.userEmail}</span>
                      <span>·</span>
                      <span>
                        {format(
                          new Date(report.createdAt),
                          "d MMM yyyy · HH:mm",
                          { locale: fr },
                        )}
                      </span>
                      {report.screenshots.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <ImageIcon size={11} /> {report.screenshots.length}{" "}
                            capture{report.screenshots.length > 1 ? "s" : ""}
                          </span>
                        </>
                      )}
                    </div>
                    {report.adminMessage && (
                      <p className="text-xs text-muted-foreground italic">
                        Réponse : {report.adminMessage}
                      </p>
                    )}
                  </div>

                  {report.status === "open" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => setSelected(report)}
                    >
                      Traiter
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <ResolveDialog report={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
