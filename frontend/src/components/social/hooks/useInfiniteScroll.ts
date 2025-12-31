/* eslint-disable @typescript-eslint/no-explicit-any */
// components/social/hooks/useInfiniteScroll.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UseInfiniteScrollOptions<T> {
  limit?: number;
  initialPage?: number;
  dependencies?: any[];
  onLoadMore?: (page: number) => void;
}

export function useInfiniteScroll<T>(
  fetchFn: (page: number, limit: number) => Promise<{ data: T[]; pagination?: PaginationInfo }>,
  options: UseInfiniteScrollOptions<T> = {}
) {
  const {
    limit = 20,
    initialPage = 1,
    dependencies = [],
    onLoadMore
  } = options;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn(page, limit);
      const newItems = result.data;
      const pagination = result.pagination;

      setItems(prev => [...prev, ...newItems]);
      setPage(prev => prev + 1);
      
      if (pagination) {
        setTotal(pagination.total);
        setHasMore(page < pagination.pages);
      } else {
        setHasMore(newItems.length === limit);
      }

      onLoadMore?.(page);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading more items:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore, fetchFn, limit, onLoadMore]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    setTotal(0);
  }, [initialPage]);

  // Initialize
  useEffect(() => {
    loadMore();
  }, []);

  // Reset when dependencies change
  useEffect(() => {
    if (dependencies.length > 0) {
      reset();
    }
  }, dependencies);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, isLoading, hasMore]);

  return {
    items,
    isLoading,
    error,
    hasMore,
    loadMore,
    reset,
    page,
    total,
    loadMoreRef
  };
}