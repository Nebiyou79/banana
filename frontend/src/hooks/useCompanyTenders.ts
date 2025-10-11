/* eslint-disable @typescript-eslint/no-explicit-any */
// /src/hooks/useCompanyTenders.ts (FIXED)
import { useState, useCallback } from 'react';
import { tenderService, Tender, TenderCreateData } from '@/services/tenderService';
import { useAuth } from '@/contexts/AuthContext';

export const useCompanyTenders = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const getCompanyId = useCallback((): string | null => {
    if (!user) return null;
    
    const userAny = user as any;
    
    // Check all possible locations for company ID
    if (userAny.company?._id) {
      return userAny.company._id;
    }
    
    if (typeof userAny.company === 'string') {
      return userAny.company;
    }
    
    if (userAny.companyId) {
      return userAny.companyId;
    }
    
    return null;
  }, [user]);

  const fetchCompanyTenders = useCallback(async (status?: string) => {
    const companyId = getCompanyId();
    
    if (!companyId) {
      setError('Company ID not found. Please complete your company profile and ensure it is properly saved.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const companyTenders = await tenderService.getCompanyTenders(companyId, status);
      setTenders(companyTenders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch company tenders');
    } finally {
      setLoading(false);
    }
  }, [getCompanyId]);

  const createTender = useCallback(async (tenderData: Partial<TenderCreateData>) => {
    const companyId = getCompanyId();
    
    if (!companyId) {
      throw new Error('Company ID not found. Please complete your company profile first and ensure it is properly saved.');
    }

    setLoading(true);
    setError(null);
    try {
      // Use TenderCreateData type which expects company as string ID
      const tenderWithCompany: TenderCreateData = {
        ...tenderData as TenderCreateData,
        company: companyId
      };
      
      const newTender = await tenderService.createTender(tenderWithCompany);
      setTenders(prev => [newTender, ...prev]);
      return newTender;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tender';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [getCompanyId]);

  const updateTender = useCallback(async (id: string, tenderData: Partial<TenderCreateData>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedTender = await tenderService.updateTender(id, tenderData);
      setTenders(prev => prev.map(t => t._id === id ? updatedTender : t));
      return updatedTender;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update tender';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTender = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await tenderService.deleteTender(id);
      setTenders(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tender';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tenders,
    loading,
    error,
    fetchCompanyTenders,
    createTender,
    updateTender,
    deleteTender,
    hasCompany: !!getCompanyId(),
    companyId: getCompanyId()
  };
};