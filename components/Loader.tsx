import { DotmSquare15 } from "@/components/ui/dotm-square-15"
import { cn } from "@/lib/utils"

export default function Loader({
  className,
  size = 18,
}: {
  className?: string
  size?: number
}) {
  return (
    <DotmSquare15
      className={cn("inline-flex align-middle text-current", className)}
      size={size}
      dotSize={2.5}
      speed={1.1}
      animated
      ariaLabel="Loading"
    />
  )
}
