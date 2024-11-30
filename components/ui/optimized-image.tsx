"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ComponentPropsWithoutRef<typeof Image> {
  fallbackSrc?: string;
}

export function OptimizedImage({
  alt,
  src,
  fallbackSrc = "/img/placeholder.png",
  className,
  ...props
}: OptimizedImageProps) {
  const [error, setError] = useState(false);

  return (
    <Image
      {...props}
      src={error ? fallbackSrc : src}
      alt={alt}
      className={cn("transition-opacity duration-300", className)}
      quality={90}
      onError={() => setError(true)}
      loading="lazy"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}
