import { cn } from "@/lib/utils";

type Props = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  placeholder?: string;
  rows?: number;
  children?: React.ReactNode;
  className?: string;
  help?: string;
  autoComplete?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
};

export function FormField({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
  rows,
  children,
  className,
  help,
  autoComplete,
  onChange,
}: Props) {
  const inputClass = "admin-input";

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={name} className="admin-label">
        {label} {required && <span className="admin-required" aria-hidden="true">*</span>}
      </label>
      {children ?? (
        rows ? (
          <textarea
            id={name}
            name={name}
            rows={rows}
            required={required}
            defaultValue={defaultValue}
            placeholder={placeholder}
            onChange={onChange}
            className={cn(inputClass, "resize-y")}
          />
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            required={required}
            defaultValue={defaultValue}
            placeholder={placeholder}
            autoComplete={autoComplete}
            onChange={onChange}
            className={inputClass}
          />
        )
      )}
      {help && <p className="admin-help-text">{help}</p>}
    </div>
  );
}
