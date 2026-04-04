// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

/**
 * A custom hook that debounces a value.
 * Useful for delaying API calls until user stops typing.
 * 
 * @param value - The value to debounce (can be any type)
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // API call will only happen 500ms after user stops typing
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set a timeout to update the debounced value after the specified delay
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cleanup function to clear the timeout if value changes or component unmounts
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * A more advanced version with immediate execution option
 * Useful when you need to execute immediately for certain conditions
 */
export function useDebounceWithOptions<T>(
    value: T,
    delay: number = 300,
    immediate: boolean = false
): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // If immediate is true and value is truthy, update immediately
        if (immediate && value) {
            setDebouncedValue(value);
            return;
        }

        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay, immediate]);

    return debouncedValue;
}

/**
 * A hook that debounces a function callback
 * Useful for debouncing event handlers directly
 * 
 * @example
 * ```tsx
 * const debouncedSearch = useDebouncedCallback((term: string) => {
 *   searchAPI(term);
 * }, 500);
 * 
 * return <input onChange={(e) => debouncedSearch(e.target.value)} />;
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 300
): T {
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();

    useEffect(() => {
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [timeoutId]);

    return ((...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        const id = setTimeout(() => {
            callback(...args);
        }, delay);

        setTimeoutId(id);
    }) as T;
}

/**
 * A hook that debounces a value and provides loading state
 * Useful for showing loading indicators during debounce
 * 
 * @example
 * ```tsx
 * const { debouncedValue, isDebouncing } = useDebounceWithLoading(searchTerm, 500);
 * 
 * return (
 *   <div>
 *     {isDebouncing && <Spinner />}
 *     <Results data={fetchResults(debouncedValue)} />
 *   </div>
 * );
 * ```
 */
export function useDebounceWithLoading<T>(
    value: T,
    delay: number = 300
): { debouncedValue: T; isDebouncing: boolean } {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    const [isDebouncing, setIsDebouncing] = useState(false);

    useEffect(() => {
        setIsDebouncing(true);

        const handler = setTimeout(() => {
            setDebouncedValue(value);
            setIsDebouncing(false);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return { debouncedValue, isDebouncing };
}

/**
 * A hook that debounces multiple values
 * Useful for complex filter objects
 * 
 * @example
 * ```tsx
 * const filters = { search: term, category, priceRange };
 * const debouncedFilters = useDebounceObject(filters, 500);
 * ```
 */
export function useDebounceObject<T extends Record<string, any>>(
    obj: T,
    delay: number = 300
): T {
    const [debouncedObj, setDebouncedObj] = useState<T>(obj);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedObj(obj);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [JSON.stringify(obj), delay]); // Use JSON.stringify for deep comparison

    return debouncedObj;
}