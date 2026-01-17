import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  // Show max 5 page indicators
  const getVisiblePages = () => {
    if (totalPages <= 5) return pages

    if (currentPage <= 3) return pages.slice(0, 5)
    if (currentPage >= totalPages - 2) return pages.slice(-5)

    return pages.slice(currentPage - 3, currentPage + 2)
  }

  const visiblePages = getVisiblePages()

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1">
        {visiblePages[0] > 1 && (
          <>
            <PageButton page={1} current={currentPage} onClick={onPageChange} />
            {visiblePages[0] > 2 && <span className="text-text-muted px-2">...</span>}
          </>
        )}

        {visiblePages.map((page) => (
          <PageButton
            key={page}
            page={page}
            current={currentPage}
            onClick={onPageChange}
          />
        ))}

        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <span className="text-text-muted px-2">...</span>
            )}
            <PageButton page={totalPages} current={currentPage} onClick={onPageChange} />
          </>
        )}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

function PageButton({
  page,
  current,
  onClick,
}: {
  page: number
  current: number
  onClick: (page: number) => void
}) {
  return (
    <button
      onClick={() => onClick(page)}
      className={cn(
        "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
        page === current
          ? "bg-primary text-white"
          : "text-text-secondary hover:bg-surface-elevated"
      )}
    >
      {page}
    </button>
  )
}
