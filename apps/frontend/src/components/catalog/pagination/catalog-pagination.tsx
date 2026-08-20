import { cn } from '@lib/helpers/cn';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@tienda/ui';

type CatalogPaginationProps = {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  className?: string;
};

export function CatalogPagination({ currentPage, totalPages, buildHref, className }: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | 'ellipsis')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis');
    }
  }

  return (
    <Pagination className={cn('pt-6', className)}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={buildHref(Math.max(1, currentPage - 1))}
            aria-label="Ir a página anterior"
            className={currentPage <= 1 ? 'pointer-events-none opacity-40' : ''}
          />
        </PaginationItem>

        {pages.map((page, i) =>
          page === 'ellipsis' ? (
            <PaginationItem key={`e-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                href={buildHref(page)}
                isActive={page === currentPage}
                aria-label={`Ir a página ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href={buildHref(Math.min(totalPages, currentPage + 1))}
            aria-label="Ir a página siguiente"
            className={currentPage >= totalPages ? 'pointer-events-none opacity-40' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}