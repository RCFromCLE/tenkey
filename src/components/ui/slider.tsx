import * as React from "react"

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onValueChange'> {
  value?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value = [0], onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    return (
      <input
        type="range"
        className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${className || ''}`}
        ref={ref}
        value={value[0]}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onValueChange?.([parseFloat(e.target.value)])}
        {...props}
      />
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
