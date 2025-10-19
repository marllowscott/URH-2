import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, User } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName?: string;
  currentImage?: string;
  onSave: (name: string, image: string) => void;
}

export default function ProfileModal({ isOpen, onClose, currentName = "", currentImage = "", onSave }: ProfileModalProps) {
  const [name, setName] = useState(currentName);
  const [image, setImage] = useState(currentImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(name, image);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] backdrop-blur-sm bg-white/95 border border-white/20 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader>
          <DialogTitle className="text-[#0747A1]">Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and avatar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24 ring-4 ring-[#0747A1]/20">
                <AvatarImage src={image} alt="Profile" />
                <AvatarFallback className="bg-gradient-to-br from-[#0747A1] to-[#0A58CA] text-white">
                  <User className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-[#0747A1] rounded-full p-1">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 border-[#0747A1] text-[#0747A1] hover:bg-[#0747A1] hover:text-white transition-colors"
            >
              <Camera className="w-4 h-4" />
              Change Photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-[#0747A1] font-medium">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="border-[#0747A1]/30 focus:border-[#0747A1] focus:ring-[#0747A1]/20"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="border-[#0747A1] text-[#0747A1] hover:bg-[#0747A1] hover:text-white">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#0747A1] hover:bg-[#063d8c] text-white">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}