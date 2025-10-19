import { memo } from "react";
import { Eye, Download, Pencil, Trash2, Clock } from "lucide-react";

type Resource = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string | null;
  file_path: string | null;
  created_at: string;
};

interface ResourceCardProps {
  resource: Resource;
  onPreview: () => void;
  onDownload: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetExpiry?: () => void;
  showCrudIcons?: boolean;
}

const ResourceCard = memo(ResourceCardComponent);

export default ResourceCard;

function ResourceCardComponent({ resource, onPreview, onDownload, onEdit, onDelete, onSetExpiry, showCrudIcons = false }: ResourceCardProps) {
  const handleAction = () => {
    if (resource.type === "link" && resource.url) {
      window.open(resource.url, "_blank");
    } else if (resource.file_path) {
      onPreview();
    }
  };

  return (
    <div className="bg-white border border-[#E6E6E6] rounded-2xl shadow-sm p-6 w-full max-w-xs hover:shadow-md transition relative">
      {showCrudIcons && (
        <div className="flex gap-1 mb-3">
          <button
            onClick={onEdit}
            className="w-8 h-8 bg-[#0747A1] hover:bg-[#063d8c] text-white rounded-lg flex items-center justify-center transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onSetExpiry}
            className="w-8 h-8 bg-[#FF8181] hover:bg-[#FF8181]/80 text-white rounded-lg flex items-center justify-center transition-colors"
            title="Set Expiry"
          >
            <Clock size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <div className="text-[#0747A1] text-lg font-semibold capitalize">{resource.title}</div>
        {resource.type && (
          <span
            className={`text-white text-xs px-2 py-1 rounded-md font-medium ${
              resource.type === "video"
                ? "bg-[#FDB353]"
                : resource.type === "pdf"
                ? "bg-[#0747A1]"
                : "bg-[#FF8181]"
            }`}
          >
            {resource.type.toUpperCase()}
          </span>
        )}
      </div>

      <p className="text-gray-600 text-sm mb-6">{resource.description || "No description available"}</p>

      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        {resource.type === "link" ? (
          <button
            onClick={handleAction}
            className="flex-1 flex items-center gap-2 border border-[#0747A1] text-[#0747A1] font-medium py-2 px-4 rounded-xl hover:bg-[#E6F2FF] transition"
          >
            <Eye size={16} /> Open Link
          </button>
        ) : (
          <>
            <button
              onClick={onPreview}
              className="flex-1 flex items-center gap-2 border border-[#0747A1] text-[#0747A1] font-medium py-2 px-4 rounded-xl hover:bg-[#E6F2FF] transition"
            >
              <Eye size={16} /> Preview
            </button>
            <button
              onClick={onDownload}
              className="flex-1 flex items-center gap-2 bg-[#FF8181] text-white font-medium py-2 px-4 rounded-xl hover:bg-[#FF8181]/80 transition"
            >
              <Download size={16} /> Download
            </button>
          </>
        )}
      </div>
    </div>
  );
}
