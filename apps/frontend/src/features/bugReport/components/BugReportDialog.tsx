import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUploadImage } from "@/features/files/api/hooks";
import { useSubmitBugReport } from "../api/hooks";
import { toast } from "sonner";
import { XIcon, CameraIcon, SpinnerIcon } from "@phosphor-icons/react";
import type { DeviceInfo } from "@ext/schemas";

// ── Collecte d'infos navigateur ───────────────────────────────────────────────

function collectWebDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;

  let browser = "Unknown";
  let browserVersion = "";
  if (/Firefox\/([\d.]+)/.test(ua)) {
    browser = "Firefox";
    browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] ?? "";
  } else if (/Edg\/([\d.]+)/.test(ua)) {
    browser = "Edge";
    browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] ?? "";
  } else if (/OPR\/([\d.]+)/.test(ua)) {
    browser = "Opera";
    browserVersion = ua.match(/OPR\/([\d.]+)/)?.[1] ?? "";
  } else if (/Chrome\/([\d.]+)/.test(ua)) {
    browser = "Chrome";
    browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] ?? "";
  } else if (/Version\/([\d.]+).*Safari/.test(ua)) {
    browser = "Safari";
    browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] ?? "";
  }

  let os = "Unknown";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad/.test(ua)) os = "iOS";
  else if (/Mac/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return {
    platform: "web",
    browser,
    browserVersion,
    os,
    userAgent: ua.slice(0, 300),
    screenSize: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
  };
}

// ── Composant ─────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BugReportDialog({ open, onOpenChange }: Props) {
  const [description, setDescription] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>([]);

  const { mutate: submit, isPending } = useSubmitBugReport();
  const { mutate: uploadImage, isPending: isUploading } = useUploadImage();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      uploadImage(file, {
        onSuccess: (data) => setScreenshots((prev) => [...prev, data.url]),
        onError: () => toast.error("Échec de l'upload"),
      });
    });
    e.target.value = "";
  };

  const handleSubmit = () => {
    if (description.trim().length < 10) {
      toast.error("Décrivez le problème en au moins 10 caractères");
      return;
    }
    submit(
      {
        description: description.trim(),
        screenshots,
        deviceInfo: collectWebDeviceInfo(),
      },
      {
        onSuccess: () => {
          toast.success("Signalement envoyé, merci !");
          setDescription("");
          setScreenshots([]);
          onOpenChange(false);
        },
        onError: () => toast.error("Erreur lors de l'envoi"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Signaler un problème</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Description */}
          <div className="space-y-2">
            <Label>Description du problème *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le problème que vous avez rencontré : ce que vous faisiez, ce qui s'est passé, comment reproduire…"
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length} / min. 10 car.
            </p>
          </div>

          {/* Captures d'écran */}
          <div className="space-y-2">
            <Label>
              Captures d'écran
              <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                (optionnel)
              </span>
            </Label>

            {screenshots.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {screenshots.map((url, i) => (
                  <div key={url} className="relative group">
                    <img
                      src={url}
                      alt={`Capture ${i + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setScreenshots((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XIcon size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer w-fit px-3 py-2 rounded-lg border border-dashed border-border hover:bg-muted/40 transition-colors text-sm text-muted-foreground">
              {isUploading ? (
                <SpinnerIcon size={15} className="animate-spin" />
              ) : (
                <CameraIcon size={15} />
              )}
              {isUploading ? "Upload…" : "Ajouter une capture"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading || screenshots.length >= 5}
              />
            </label>
            {screenshots.length >= 5 && (
              <p className="text-xs text-muted-foreground">
                Maximum 5 captures atteint
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            loading={isPending || isUploading}
            onClick={handleSubmit}
            disabled={description.trim().length < 10}
          >
            Envoyer le signalement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
