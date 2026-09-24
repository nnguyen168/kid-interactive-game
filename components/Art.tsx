import Image from "next/image";
import { ArtKey } from "@/lib/art";

export default function Art({
  name,
  className = "",
  alt = "",
  eager = false,
}: {
  name: ArtKey;
  className?: string;
  alt?: string;
  eager?: boolean;
}) {
  return (
    <Image
      src={`/art/${name}.png`}
      alt={alt}
      width={256}
      height={256}
      unoptimized
      draggable={false}
      loading={eager ? "eager" : "lazy"}
      className={`select-none pointer-events-none object-contain ${className}`}
    />
  );
}
