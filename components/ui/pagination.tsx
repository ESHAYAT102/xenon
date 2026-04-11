import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const Pagination = ({
  className,
  onPageChange,
  currentPage,
  totalPages,
  ...props
}: React.ComponentProps<"nav"> & {
  onPageChange: (page: number) => void
  currentPage: number
  totalPages: number
}) => {
  const pages = React.useMemo(() => {
    const items: (number | "ellipsis")[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i)
      }
    } else {
      items.push(1)

      if (currentPage > maxVisible) {
        items.push("ellipsis")
      }

      const start = Math.max(2, currentPage - Math.floor(maxVisible / 2))
      const end = Math.min(
        totalPages - 1,
        currentPage + Math.floor(maxVisible / 2)
      )

      for (let i = start; i <= end; i++) {
        if (!items.includes(i)) {
          items.push(i)
        }
      }

      if (currentPage < totalPages - maxVisible + 1) {
        items.push("ellipsis")
      }

      if (!items.includes(totalPages)) {
        items.push(totalPages)
      }
    }

    return items
  }, [currentPage, totalPages])

  return (
    <nav
      className={cn("mx-auto flex w-full justify-center gap-1", className)}
      aria-label="pagination"
      {...props}
    >
      <Button
        variant="outline"
        size="icon"
        className="size-9 rounded-full"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </Button>

      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="flex size-9 items-center justify-center"
          >
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? "secondary" : "outline"}
            size="icon"
            className="size-9 rounded-full"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        className="size-9 rounded-full"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </Button>
    </nav>
  )
}

export { Pagination }
