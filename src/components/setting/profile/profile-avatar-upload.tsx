"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Camera, Trash2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAvatarFallbackText } from "@/utils/avatar";

interface ProfileAvatarUploadProps {
  photoUrl: string | null;
  nickname: string;
  onFileChange: (file: File | null) => void;
}

export default function ProfileAvatarUpload({
  photoUrl,
  nickname,
  onFileChange,
}: ProfileAvatarUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileChange(file);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) onFileChange(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
      <div
        className="relative shrink-0"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => inputRef.current?.click()}
      >
        <div
          className={cn(
            "pointer-events-none absolute -inset-2 rounded-full border-2 border-dashed transition-opacity",
            isDragging ? "border-brand opacity-100" : "border-transparent opacity-0",
          )}
        />

        <Avatar className="ring-brand size-24 cursor-pointer ring-2 transition-all hover:ring-[3px] sm:size-28">
          <AvatarImage src={photoUrl ?? undefined} alt="profile" className="object-cover" />
          <AvatarFallback className="text-muted-foreground bg-muted text-3xl font-semibold">
            {getAvatarFallbackText(nickname, 1)}
          </AvatarFallback>
        </Avatar>

        <div
          className={cn(
            "pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full text-white transition-opacity",
            isHovering || isDragging ? "bg-black/55 opacity-100 dark:bg-black/70" : "opacity-0",
          )}
        >
          <Camera className="size-6" />
          <span className="text-xs font-medium tracking-wider uppercase">
            {isDragging ? "Drop" : "변경"}
          </span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      <div className="min-w-0 flex-1 text-center sm:text-left">
        <h3 className="mb-1 text-sm font-semibold">프로필 사진</h3>
        <p className="text-muted-foreground mb-4 text-xs leading-relaxed">
          드래그해서 올리거나 이미지를 클릭하세요.
          <br className="hidden sm:block" />
          정사각형 비율, 최대 5MB (JPG, PNG, WEBP).
        </p>
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-brand! text-brand! hover:opacity-60"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-1.5 size-3.5" />
            업로드
          </Button>
          {photoUrl && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="border-destructive! text-destructive! hover:opacity-60"
            >
              <Trash2 className="mr-1.5 size-3.5" />
              제거
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
