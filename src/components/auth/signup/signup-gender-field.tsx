import { Field, FieldContent, FieldLabel, FieldTitle } from "@/components/ui/field";
import { RadioGroupItem } from "@/components/ui/radio-group";

interface Props {
  htmlFor: string;
  content: string;
  radioValue: string;
}

export default function SignUpGenderField({ htmlFor, content, radioValue }: Props) {
  return (
    <FieldLabel
      htmlFor={htmlFor}
      className={
        "has-data-checked:border-brand! cursor-pointer transition-opacity duration-200 hover:opacity-60 has-data-checked:border-2!"
      }
    >
      <Field orientation={"horizontal"}>
        <FieldContent>
          <FieldTitle>{content}</FieldTitle>
        </FieldContent>
        <RadioGroupItem
            value={radioValue}
            id={radioValue}
            className="data-checked:border-brand! data-checked:bg-brand!"
          />
      </Field>
    </FieldLabel>
  );
}
