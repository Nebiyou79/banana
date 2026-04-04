/* eslint-disable @typescript-eslint/no-empty-object-type */
import React from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton component — a simple animated loading placeholder.
 * Use it to show loading states for text, images, or cards.
 *
 * Example:
 * <Skeleton className="h-6 w-32" />
 */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    />
  );
};
