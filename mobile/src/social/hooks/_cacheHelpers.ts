import type { QueryClient } from '@tanstack/react-query';
import type { Post } from '../types';

/**
 * Apply an `updater` to any post matching `postId` across every cache
 * that can hold posts (feed / myPosts / savedPosts / profilePosts / post).
 * Handles both infinite-query shapes (with `pages`) and flat arrays.
 */
export const updateAllPostCaches = (
  qc: QueryClient,
  postId: string,
  updater: (p: Post) => Post
) => {
  const rootKeys: string[][] = [
    ['social', 'feed'],
    ['social', 'myPosts'],
    ['social', 'savedPosts'],
    ['social', 'profilePosts'],
  ];

  rootKeys.forEach((key) => {
    qc.setQueriesData({ queryKey: key }, (old: any) => {
      if (!old) return old;

      // useInfiniteQuery: { pages: [{ data: Post[], pagination }], pageParams }
      if (old.pages) {
        return {
          ...old,
          pages: old.pages.map((pg: any) => ({
            ...pg,
            data: Array.isArray(pg?.data)
              ? pg.data.map((p: Post) => (p?._id === postId ? updater(p) : p))
              : pg?.data,
          })),
        };
      }

      // useQuery with select flattening: raw response { data: Post[] }
      if (old?.data && Array.isArray(old.data)) {
        return {
          ...old,
          data: old.data.map((p: Post) =>
            p?._id === postId ? updater(p) : p
          ),
        };
      }

      // Already-flattened Post[]
      if (Array.isArray(old)) {
        return old.map((p: Post) => (p?._id === postId ? updater(p) : p));
      }

      return old;
    });
  });

  // Single post cache
  qc.setQueryData<any>(['social', 'post', postId], (old: any) => {
    if (!old) return old;
    if (old?.data?.data) {
      return { ...old, data: { ...old.data, data: updater(old.data.data) } };
    }
    if (old?._id === postId) return updater(old);
    return old;
  });
};

/**
 * Snapshot all post caches so we can roll back on error.
 * Returns an opaque blob you pass back to `restoreAllPostCaches`.
 */
export const snapshotAllPostCaches = (qc: QueryClient) => {
  const rootKeys: string[][] = [
    ['social', 'feed'],
    ['social', 'myPosts'],
    ['social', 'savedPosts'],
    ['social', 'profilePosts'],
    ['social', 'post'],
  ];
  return rootKeys.flatMap((key) =>
    qc.getQueriesData({ queryKey: key }).map(([k, v]) => ({
      key: k as unknown[],
      value: v,
    }))
  );
};

export const restoreAllPostCaches = (
  qc: QueryClient,
  snapshot: Array<{ key: unknown[]; value: unknown }>
) => {
  snapshot.forEach(({ key, value }) => {
    qc.setQueryData(key, value);
  });
};
