"use client";

import { cn } from "@/lib/utils";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
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
          <InputGroupAddon
            align="inline-end"
            className="hover:text-brand cursor-pointer px-3 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </InputGroupAddon>
        )}
      </InputGroup>
    );
  },
);

AuthInputGroup.displayName = "AuthInputGroup";
export default AuthInputGroup;
