/**
 * mobile/src/utils/productDebug.ts
 *
 * Drop-in debug utility that instruments every layer of the company-product
 * pipeline:  authStore → useCompanyId → useCompanyProducts → productService
 *
 * HOW TO USE
 * ----------
 * 1. Import ProductDebugPanel into your screen and render it at the top:
 *       import { ProductDebugPanel } from '../../utils/productDebug';
 *       // inside JSX:
 *       <ProductDebugPanel companyId={companyId} authReady={authReady} queryResult={queryResult} />
 *
 * 2. Call debugLog() anywhere to get a timestamped console group.
 *
 * 3. Wrap your productService calls with traceServiceCall() to see exact
 *    request URL + response shape.
 *
 * 4. Remove / tree-shake for production by setting ENABLE_PRODUCT_DEBUG=false.
 *
 * WHAT EACH LOG TELLS YOU
 * -----------------------
 * [AUTH]    → is the auth store hydrated? what is user.role / user.company?
 * [COMPID]  → what ID did useCompanyId() resolve to?
 * [QUERY]   → React Query state: enabled / status / fetchStatus / dataUpdatedAt
 * [SERVICE] → exact URL called, HTTP status, raw response shape
 * [DATA]    → how many products came back, pagination shape
 * [RENDER]  → what the screen is actually showing (spinner / empty / list)
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

// ── Config ────────────────────────────────────────────────────────────────────

const ENABLE_PRODUCT_DEBUG = __DEV__;

// ── Core logger ───────────────────────────────────────────────────────────────

export function debugLog(
  namespace: '[AUTH]' | '[COMPID]' | '[QUERY]' | '[SERVICE]' | '[DATA]' | '[RENDER]',
  label: string,
  data?: unknown,
) {
  if (!ENABLE_PRODUCT_DEBUG) return;
  const ts = new Date().toISOString().slice(11, 23); // HH:mm:ss.mmm
  console.group(`🛒 ${namespace} ${label}  (${ts})`);
  if (data !== undefined) console.log(data);
  console.groupEnd();
}

// ── Auth-store inspector ──────────────────────────────────────────────────────

export function debugAuthStore(user: any, isHydrated: boolean) {
  if (!ENABLE_PRODUCT_DEBUG) return;
  debugLog('[AUTH]', 'Auth store state', {
    isHydrated,
    userId: user?._id ?? 'MISSING',
    role: user?.role ?? 'MISSING',
    // company field can be string, object, or null
    companyRaw: user?.company ?? 'null/undefined',
    companyType: typeof user?.company,
    companyId:
      typeof user?.company === 'string'
        ? user.company
        : user?.company?._id ?? 'NOT_RESOLVABLE',
    hasCompanyProfile: user?.hasCompanyProfile ?? false,
  });
}

// ── useCompanyId inspector ────────────────────────────────────────────────────

export function debugCompanyId(resolvedId: string | null, isReady: boolean) {
  if (!ENABLE_PRODUCT_DEBUG) return;
  debugLog('[COMPID]', 'Resolved company ID', {
    resolvedId: resolvedId ?? 'NULL ← query will not fire',
    isReady,
    willQueryFire: isReady && !!resolvedId,
    verdict: !isReady
      ? '⏳ Auth still hydrating — wait'
      : !resolvedId
      ? '❌ No company ID — check user.company and user.role'
      : '✅ Query enabled',
  });
}

// ── React Query state inspector ───────────────────────────────────────────────

export function debugQueryState(label: string, queryResult: {
  status: string;
  fetchStatus: string;
  isLoading: boolean;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  data: any;
  dataUpdatedAt: number;
}) {
  if (!ENABLE_PRODUCT_DEBUG) return;

  const {
    status, fetchStatus, isLoading, isPending, isError, error, data, dataUpdatedAt,
  } = queryResult;

  const pages = data?.pages ?? [];
  const products = pages.flatMap((p: any) => p?.products ?? []);
  const pagination = pages[0]?.pagination ?? null;

  debugLog('[QUERY]', label, {
    status,
    fetchStatus,
    isLoading,
    isPending,
    isError,
    error: isError ? String(error) : null,
    dataUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : 'never',
    pageCount: pages.length,
    totalProductsLoaded: products.length,
    pagination,
    firstProduct: products[0]
      ? { _id: products[0]._id, name: products[0].name, status: products[0].status }
      : null,
    verdict:
      status === 'pending' && fetchStatus === 'idle'
        ? '❌ Query is DISABLED (enabled=false) — companyId is null or isReady=false'
        : status === 'pending' && fetchStatus === 'fetching'
        ? '⏳ Fetching first page...'
        : status === 'error'
        ? `❌ Query errored: ${String(error)}`
        : status === 'success' && products.length === 0
        ? '⚠️  Query succeeded but 0 products returned — check backend / filter'
        : `✅ ${products.length} products loaded`,
  });
}

// ── Service call tracer ───────────────────────────────────────────────────────

/**
 * Wraps any async function and logs input + output.
 * Usage:
 *   const result = await traceServiceCall(
 *     'getCompanyProducts',
 *     () => productService.getCompanyProducts(id, filters)
 *   );
 */
export async function traceServiceCall<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (!ENABLE_PRODUCT_DEBUG) return fn();

  debugLog('[SERVICE]', `→ Calling ${name}`);
  const start = Date.now();
  try {
    const result = await fn();
    const ms = Date.now() - start;
    debugLog('[SERVICE]', `← ${name} OK (${ms}ms)`, {
      resultType: typeof result,
      isArray: Array.isArray(result),
      keys: result && typeof result === 'object' ? Object.keys(result as object) : null,
      // Show the shape of the first level of response
      preview:
        result && typeof result === 'object'
          ? JSON.parse(JSON.stringify(result, null, 0)).slice?.(0, 500) ??
            JSON.stringify(result).slice(0, 500)
          : result,
    });
    return result;
  } catch (err) {
    const ms = Date.now() - start;
    debugLog('[SERVICE]', `← ${name} ERROR (${ms}ms)`, {
      error: String(err),
      stack: err instanceof Error ? err.stack?.slice(0, 300) : undefined,
    });
    throw err;
  }
}

// ── Data shape validator ──────────────────────────────────────────────────────

/**
 * Call after getCompanyProducts() to check the response shape is what
 * useCompanyProducts() expects:
 *   { products: Product[], pagination: { current, pages, total, limit } }
 */
export function debugValidateResponseShape(label: string, response: any) {
  if (!ENABLE_PRODUCT_DEBUG) return;

  const issues: string[] = [];

  if (!response) {
    issues.push('Response is null/undefined');
  } else {
    if (!Array.isArray(response.products)) {
      issues.push(
        `response.products is ${typeof response.products} (expected array). ` +
        `Actual keys: ${Object.keys(response ?? {}).join(', ')}`,
      );
    }
    if (!response.pagination) {
      issues.push('response.pagination is missing');
    } else {
      const { current, pages, total, limit } = response.pagination;
      if (current === undefined) issues.push('pagination.current missing');
      if (pages === undefined) issues.push('pagination.pages missing');
      if (total === undefined) issues.push('pagination.total missing');
      if (limit === undefined) issues.push('pagination.limit missing');
    }
  }

  debugLog('[DATA]', label, {
    valid: issues.length === 0,
    issues: issues.length > 0 ? issues : 'none ✅',
    productCount: Array.isArray(response?.products) ? response.products.length : 'N/A',
    pagination: response?.pagination ?? 'MISSING',
  });
}

// ── Render state inspector ────────────────────────────────────────────────────

export function debugRenderState(params: {
  showAuthSpinner: boolean;
  showDataSpinner: boolean;
  isOwner: boolean;
  isError: boolean;
  productCount: number;
  statusFilter: string;
}) {
  if (!ENABLE_PRODUCT_DEBUG) return;
  const { showAuthSpinner, showDataSpinner, isOwner, isError, productCount, statusFilter } = params;

  const showing = showAuthSpinner
    ? 'AUTH_SPINNER'
    : showDataSpinner
    ? 'DATA_SPINNER'
    : !isOwner
    ? 'ACCESS_DENIED_WALL'
    : isError
    ? 'ERROR_STATE'
    : productCount === 0
    ? 'EMPTY_STATE'
    : 'PRODUCT_LIST';

  debugLog('[RENDER]', `Screen is showing: ${showing}`, {
    showAuthSpinner,
    showDataSpinner,
    isOwner,
    isError,
    productCount,
    statusFilter,
    verdict:
      showing === 'ACCESS_DENIED_WALL'
        ? '❌ isOwner=false — check useIsCompanyOwner()'
        : showing === 'EMPTY_STATE'
        ? '⚠️  Products array is empty — check query + backend'
        : showing === 'PRODUCT_LIST'
        ? '✅ Rendering product list'
        : `ℹ️  ${showing}`,
  });
}

// ── On-screen debug panel (DEV only) ─────────────────────────────────────────

interface PanelProps {
  companyId: string | null;
  authReady: boolean;
  isOwner: boolean;
  queryResult: {
    status: string;
    fetchStatus: string;
    isError: boolean;
    error: unknown;
    data: any;
  };
  statusFilter: string;
}

/**
 * Render this inside CompanyProductListScreen during debugging.
 * Remove before shipping.
 *
 * Example:
 *   {__DEV__ && (
 *     <ProductDebugPanel
 *       companyId={companyId}
 *       authReady={authReady}
 *       isOwner={isOwner}
 *       queryResult={{ status, fetchStatus, isError, error, data: companyProductsData }}
 *       statusFilter={statusFilter}
 *     />
 *   )}
 */
export const ProductDebugPanel: React.FC<PanelProps> = ({
  companyId, authReady, isOwner, queryResult, statusFilter,
}) => {
  if (!ENABLE_PRODUCT_DEBUG) return null;

  const pages = queryResult.data?.pages ?? [];
  const productCount = pages.flatMap((p: any) => p?.products ?? []).length;
  const pagination = pages[0]?.pagination ?? null;

  const rows: [string, string][] = [
    ['authReady', String(authReady)],
    ['companyId', companyId ?? 'NULL ❌'],
    ['isOwner', String(isOwner)],
    ['query.status', queryResult.status],
    ['query.fetchStatus', queryResult.fetchStatus],
    ['query.isError', String(queryResult.isError)],
    ['query.error', queryResult.isError ? String(queryResult.error) : '—'],
    ['products loaded', String(productCount)],
    ['pagination.total', String(pagination?.total ?? '—')],
    ['statusFilter', statusFilter],
  ];

  return React.createElement(
    ScrollView,
    {
      style: dp.panel,
      horizontal: true,
      showsHorizontalScrollIndicator: false,
    },
    React.createElement(
      View,
      { style: dp.inner },
      React.createElement(Text, { style: dp.title }, '🛒 PRODUCT DEBUG PANEL'),
      rows.map(([k, v]) =>
        React.createElement(
          Text,
          { key: k, style: dp.row },
          React.createElement(Text, { style: dp.key }, `${k}: `),
          React.createElement(
            Text,
            {
              style: [
                dp.val,
                v.includes('❌') || v === 'error' ? dp.bad : v === 'success' ? dp.good : dp.neutral,
              ],
            },
            v,
          ),
        ),
      ),
    ),
  );
};

const dp = StyleSheet.create({
  panel:  { maxHeight: 180, backgroundColor: '#000d', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999 },
  inner:  { padding: 10, gap: 2 },
  title:  { color: '#fff', fontWeight: '800', fontSize: 11, marginBottom: 4 },
  row:    { fontSize: 10, fontFamily: 'monospace' },
  key:    { color: '#aaa' },
  val:    { color: '#fff' },
  bad:    { color: '#ff6b6b' },
  good:   { color: '#69db7c' },
  neutral:{ color: '#ffd43b' },
});