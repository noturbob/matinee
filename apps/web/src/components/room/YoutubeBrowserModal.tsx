"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { YoutubeBrowser } from "./YoutubeBrowser";
import { type YTVideo } from "@/lib/youtube";

interface YoutubeBrowserModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (video: YTVideo) => void;
  title?: string;
}

export function YoutubeBrowserModal({
  open, onClose, onSelect, title = "Browse YouTube",
}: YoutubeBrowserModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden rounded-lg">
          <YoutubeBrowser
            onSelect={(video) => {
              onSelect(video);
              onClose();
            }}
            onClose={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}