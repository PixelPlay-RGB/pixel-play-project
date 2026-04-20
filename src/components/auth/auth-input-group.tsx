import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { forwardRef, InputHTMLAttributes, ReactNode } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  icon: ReactNode;
}

const AuthInputGroup = forwardRef<HTMLInputElement, Props>(({ icon, ...props }, ref) => {
  return (
    <InputGroup className="w-full py-5">
      <InputGroupInput ref={ref} {...props} />
      <InputGroupAddon>{icon}</InputGroupAddon>
    </InputGroup>
  );
});

AuthInputGroup.displayName = "AuthInputGroup";
export default AuthInputGroup;
