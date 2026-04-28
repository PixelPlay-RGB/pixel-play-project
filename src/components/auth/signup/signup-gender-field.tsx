import { Field, FieldContent, FieldLabel, FieldTitle } from "@/components/ui/field";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface Props {
  htmlFor: string;
  content: string;
  radioValue: string;
}

export default function SignUpGenderField({ htmlFor, content, radioValue }: Props) {
  return (
    <FieldLabel
      htmlFor={htmlFor}
      className={cn(
        "cursor-pointer transition-all duration-200 hover:opacity-80",
        "border-2",
        "has-data-checked:border-brand! has-data-checked:opacity-100",
      )}
    >
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle className="text-sm">{content}</FieldTitle>
        </FieldContent>
        <RadioGroupItem
          value={radioValue}
          id={radioValue}
          className={cn("transition-colors", "data-checked:border-brand! data-checked:bg-brand!")}
        />
      </Field>
    </FieldLabel>
  );
}
