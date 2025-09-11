"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
  container?: Element | null;
}

/**
 * Portal component for rendering content outside the normal DOM hierarchy
 * Useful for modals, dropdowns, and notifications that need to escape stacking contexts
 */
export default function Portal({ children, container }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  const portalContainer = container || document.body;
  
  return createPortal(children, portalContainer);
}