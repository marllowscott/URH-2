import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

type Resource = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string | null;
  file_path: string | null;
  created_at: string;
};

interface PreviewModalProps {
  resource: Resource;
  onClose: () => void;
  onDownload: () => void;
}

const PreviewModal = ({ resource, onClose, onDownload }: PreviewModalProps) => {
  const [fileUrl, setFileUrl] = useState<string>("");

  useEffect(() => {
    if (resource.file_path) {
      const { data } = supabase.storage.from("resources").getPublicUrl(resource.file_path);
      if (data?.publicUrl) {
        setFileUrl(data.publicUrl);
      }
    }
  }, [resource.file_path]);

  const renderPreview = () => {
    if (resource.type === "link" && resource.url) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">External link resource</p>
          <Button onClick={() => window.open(resource.url || "", "_blank")}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Link
          </Button>
        </div>
      );
    }

    if (!fileUrl) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No preview available</p>
        </div>
      );
    }

    if (resource.type === "pdf") {
      return (
        <iframe
          src={fileUrl}
          className="w-full h-[600px] border-0 rounded-lg"
          title={resource.title}
        />
      );
    }

    if (resource.type === "video") {
      return (
        <video controls className="w-full rounded-lg" src={fileUrl}>
          Your browser does not support the video tag.
        </video>
      );
    }

    // For other document types, show download option
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
        <Button onClick={onDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download File
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{resource.title}</DialogTitle>
          <DialogDescription>{resource.description || "Preview of the selected resource"}</DialogDescription>
        </DialogHeader>
        <div className="mt-4">{renderPreview()}</div>
        {fileUrl && resource.type !== "link" && (
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PreviewModal;
