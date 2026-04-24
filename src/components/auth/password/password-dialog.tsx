"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LucideIcon } from "lucide-react";
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>비밀번호 변경</DialogTitle>
          <DialogDescription>
            {step === "verify"
              ? "비밀번호 변경을 위해 현재 비밀번호를 입력해주세요."
              : "새로운 비밀번호를 입력해주세요."}
          </DialogDescription>
        </DialogHeader>
        {step === "verify" ? (
          <PasswordVerifyForm onVerified={handleVerified} />
        ) : (
          <PasswordChangeForm
            currentPassword={currentPassword}
            onOpenChange={() => handleOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
