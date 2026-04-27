import { cn } from "@/lib/utils";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { forwardRef, InputHTMLAttributes, ReactNode } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  icon: ReactNode;
  isValid?: boolean;
}

const AuthInputGroup = forwardRef<HTMLInputElement, Props>(({ icon, isValid, ...props }, ref) => {
  return (
    <InputGroup
      className={cn("w-full", isValid && "border-brand ring-brand/20 dark:ring-brand/30 ring-3")}
    >
      <InputGroupInput ref={ref} {...props} />
      <InputGroupAddon>{icon}</InputGroupAddon>
    </InputGroup>
  );
});

AuthInputGroup.displayName = "AuthInputGroup";
export default AuthInputGroup;
