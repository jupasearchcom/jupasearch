/**
 * TapTooltip – works on both desktop (hover) and mobile/tablet (tap to toggle).
 *
 * On touch devices the trigger element is wrapped in a click handler that
 * toggles `open`. Clicking anywhere else on the page closes it.
 * On pointer devices the standard Radix hover behaviour is preserved.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TapTooltipProps {
  /** The element that triggers the tooltip */
  trigger: React.ReactNode;
  /** Tooltip content */
  children: React.ReactNode;
  /** Extra className for TooltipContent */
  contentClassName?: string;
}

export function TapTooltip({ trigger, children, contentClassName }: TapTooltipProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);

  // Close when clicking outside
  const handleOutsideClick = useCallback((e: MouseEvent | TouchEvent) => {
    if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [open, handleOutsideClick]);

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <span
          ref={triggerRef}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          {trigger}
        </span>
      </TooltipTrigger>
      <TooltipContent className={contentClassName}>
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
