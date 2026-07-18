import Image from "next/image";

import { cn } from "@/lib/utils";

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.svg"
      alt="Xtrava Capital"
      width={size}
      height={size}
      className={cn("shrink-0 rounded-lg", className)}
      priority
    />
  );
}
