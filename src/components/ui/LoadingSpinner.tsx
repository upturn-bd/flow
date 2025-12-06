import { Icon } from "@phosphor-icons/react";
import { cn } from "./class";

export type ColorType = "blue" | "emerald" | "purple" | "amber" | "red" | "gray";

type LoadingSpinnerProps = {
  /** Optional icon to display in the center of the spinner */
  icon?: Icon;
  /** Text to display alongside the spinner */
  text?: string;
  /** Color theme for the spinner (blue, emerald, purple, amber, red, gray) */
  color?: ColorType;
  /** CSS height class for the container */
  height?: string;
  /** Whether to display in horizontal layout instead of vertical */
  horizontal?: boolean;
  /** Optional additional className for the container */
  className?: string;
};

export default function LoadingSpinner({
  icon: Icon,
  text = "Loading...",
  height = "h-60",
  color = "blue",
  horizontal = false,
  className,
}: LoadingSpinnerProps) {
  // Map color to tailwind classes to avoid string interpolation security issues
  const colorMap: Record<ColorType, { spinner: string; icon: string }> = {
    blue: { spinner: "border-blue-500", icon: "text-blue-500" },
    emerald: { spinner: "border-emerald-500", icon: "text-emerald-500" },
    purple: { spinner: "border-purple-500", icon: "text-purple-500" },
    amber: { spinner: "border-amber-500", icon: "text-amber-500" },
    red: { spinner: "border-red-500", icon: "text-red-500" },
    gray: { spinner: "border-foreground-tertiary", icon: "text-foreground-tertiary" },
  };

  const colorClasses = colorMap[color as ColorType] || colorMap.blue;
  
  return (
    <div 
      className={cn(
        "flex justify-center items-center",
        height,
        horizontal ? "flex-row" : "flex-col",
        className
      )}
    >
      <div className={cn(
        "flex items-center gap-4",
        horizontal ? "flex-row" : "flex-col"
      )}>
        <div className="relative h-12 w-12 shrink-0">
          <div className={cn(
            "absolute top-0 left-0 h-full w-full rounded-full border-t-2 border-b-2 animate-spin",
            colorClasses.spinner
          )}></div>
          {Icon && (
            <Icon className={cn(
              "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 opacity-50",
              colorClasses.icon
            )} />
          )}
        </div>
        {text && (
          <p className={cn(
            "text-foreground-secondary dark:text-foreground-secondary font-medium",
            horizontal ? "ml-4" : "mt-4"
          )}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
}