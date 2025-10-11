/* eslint-disable @typescript-eslint/no-explicit-any */
// /src/hooks/useTenders.ts
import { useState, useCallback } from 'react';
import {  Tender, TenderFilters, TenderService } from '@/services/tenderService';

export const useTenders = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchTenders = useCallback(async (filters: TenderFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await TenderService.getTenders(filters);
      setTenders(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tenders');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTender = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const tender = await TenderService.getTender(id);
      return tender;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tender');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tenders,
    loading,
    error,
    pagination,
    fetchTenders,
    fetchTender,
    setTenders
  };
};