import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl px-6 md:px-10 lg:px-16",
        className
      )}
      {...props}
    />
  );
}
