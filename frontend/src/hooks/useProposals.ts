// /src/hooks/useProposals.ts
import { useState, useCallback } from 'react';
import { proposalService, Proposal, CreateProposalData } from '@/services/proposalService';

export const useProposals = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userProposals = await proposalService.getUserProposals();
      setProposals(userProposals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch proposals');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTenderProposals = useCallback(async (tenderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const tenderProposals = await proposalService.getTenderProposals(tenderId);
      setProposals(tenderProposals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tender proposals');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProposal = useCallback(async (data: CreateProposalData) => {
    setLoading(true);
    setError(null);
    try {
      const newProposal = await proposalService.createProposal(data);
      setProposals(prev => [newProposal, ...prev]);
      return newProposal;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create proposal');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProposalStatus = useCallback(async (proposalId: string, status: string, notes?: string) => {
    setLoading(true);
    setError(null);
    try {
      const updatedProposal = await proposalService.updateProposalStatus(proposalId, { status, companyNotes: notes });
      setProposals(prev => prev.map(p => 
        p._id === proposalId ? updatedProposal : p
      ));
      return updatedProposal;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update proposal status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    proposals,
    loading,
    error,
    fetchUserProposals,
    fetchTenderProposals,
    createProposal,
    updateProposalStatus
  };
};