import * as React from "react"

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onCheckedChange'> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={`h-4 w-4 rounded border border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 ${className || ''}`}
        ref={ref}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
