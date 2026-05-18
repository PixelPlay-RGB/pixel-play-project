"use client";
// password-dialog 컴포넌트를 제공합니다.

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Check, KeyRound, LucideIcon } from "lucide-react";
import { ReactElement, useState } from "react";
import PasswordChangeForm from "./password-change-form";
import PasswordVerifyForm from "./password-verify-form";

interface Props {
  className?: string;
  icon?: LucideIcon;
  label?: string;
  trigger?: ReactElement;
}

export default function PasswordDialog({ className, icon, label, trigger }: Props) {
  const Icon = icon;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"verify" | "change">("verify");
  const [currentPassword, setCurrentPassword] = useState("");

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setStep("verify");
      setCurrentPassword("");
    }
  };

  const handleVerified = (password: string) => {
    setCurrentPassword(password);
    setStep("change");
  };

  const defaultTrigger = (
    <Button variant={"ghost"} className={className}>
      {Icon && <Icon />}
      {label}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger ?? defaultTrigger} />
      <DialogContent
        className={cn(
          "overflow-hidden rounded-2xl p-0 shadow-xl sm:max-w-md",
          "border-brand/20 shadow-brand/10 dark:border-brand/10",
        )}
      >
        <DialogHeader className="bg-brand/5 border-brand/10 border-b px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1",
                "bg-brand/10 text-brand ring-brand/20",
              )}
            >
              <KeyRound className="size-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold">비밀번호 변경</DialogTitle>
              <DialogDescription className="mt-1 leading-relaxed">
                {step === "verify"
                  ? "현재 비밀번호를 확인한 뒤 새 비밀번호를 설정합니다."
                  : "다른 서비스에서 사용하지 않는 새 비밀번호를 입력해 주세요."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-5 px-5 pb-5">
          <div className="grid grid-cols-3 items-center gap-2 pt-1">
            <StepBadge
              active={step === "verify"}
              completed={step === "change"}
              label="본인 확인"
              className="w-full"
            />
            <span className="bg-border h-px w-4 justify-self-center" aria-hidden />
            <StepBadge active={step === "change"} label="새 비밀번호" className="w-full" />
          </div>
          {step === "verify" ? (
            <PasswordVerifyForm onVerified={handleVerified} />
          ) : (
            <PasswordChangeForm
              currentPassword={currentPassword}
              onOpenChange={() => handleOpenChange(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StepBadge({
  active,
  completed = false,
  label,
  className,
}: {
  active: boolean;
  completed?: boolean;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-8 items-center justify-center gap-1.5 rounded-lg border text-xs font-bold",
        active || completed
          ? "border-brand/30 bg-brand/10 text-brand"
          : "border-border bg-muted/40 text-muted-foreground",
        className,
      )}
    >
      {label}
      {completed && (
        <span className="bg-brand text-brand-foreground flex size-4 items-center justify-center rounded-full">
          <Check className="size-3" />
        </span>
      )}
    </span>
  );
}
