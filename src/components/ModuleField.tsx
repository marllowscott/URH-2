import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type ModuleData = {
  title: string;
  file: File | null;
  url: string;
  timeLimit: number;
  duration: number;
};

type Props = {
  index: number;
  module: ModuleData;
  onChange: (updates: Partial<ModuleData>) => void;
};

const ModuleField = ({ index, module, onChange }: Props) => {
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Module {index + 1}</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange({ file: null, url: "" })}
          className="text-xs"
        >
          Clear Resources
        </Button>
      </div>

      <div>
        <Label>Title</Label>
        <Input
          value={module.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Module title"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label>Upload File (Video, PDF, Slides, CSV, Excel)</Label>
          <Input
            type="file"
            accept=".pdf,.mp4,.mov,.avi,.ppt,.pptx,.xls,.xlsx,.csv,.doc,.docx"
            onChange={(e) => onChange({ file: e.target.files?.[0] || null })}
          />
          {module.file && (
            <p className="text-xs text-muted-foreground mt-1">
              Selected: {module.file.name}
            </p>
          )}
        </div>

        <div>
          <Label>URL (optional)</Label>
          <Input
            value={module.url}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>

      <div>
        <Label>Duration (minutes)</Label>
        <Input
          type="number"
          min={1}
          value={module.duration || 30}
          onChange={(e) => onChange({ duration: Number(e.target.value) || 30 })}
          placeholder="30"
        />
      </div>
    </div>
  );
};

export default ModuleField;