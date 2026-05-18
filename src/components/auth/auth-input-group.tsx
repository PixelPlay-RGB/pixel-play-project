"use client";

import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { forwardRef, InputHTMLAttributes, ReactNode, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  icon: ReactNode;
  isValid?: boolean;
}

const AuthInputGroup = forwardRef<HTMLInputElement, Props>(
  ({ icon, isValid, type, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordField = type === "password";
    const inputType = isPasswordField && showPassword ? "text" : type;

    return (
      <InputGroup
        className={cn(
          "w-full py-5 transition-all",
          isValid && "border-brand ring-brand/20 dark:ring-brand/30 ring-3",
          className,
        )}
      >
        <InputGroupAddon align="inline-start">{icon}</InputGroupAddon>

        <InputGroupInput ref={ref} type={inputType} {...props} />

        {isPasswordField && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              size="icon-xs"
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
              aria-pressed={showPassword}
              className="hover:text-brand transition-colors"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    );
  },
);

AuthInputGroup.displayName = "AuthInputGroup";
export default AuthInputGroup;
