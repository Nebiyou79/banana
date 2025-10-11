// /src/contexts/TenderFilterContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { TenderFilters } from '@/services/tenderService';

interface TenderFilterState {
  filters: TenderFilters;
  isFiltering: boolean;
}

type TenderFilterAction =
  | { type: 'SET_FILTERS'; payload: TenderFilters }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_IS_FILTERING'; payload: boolean };

interface TenderFilterContextType {
  state: TenderFilterState;
  dispatch: React.Dispatch<TenderFilterAction>;
}

const initialState: TenderFilterState = {
  filters: {
    page: 1,
    limit: 12,
    search: '',
    category: 'all',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  isFiltering: false
};

const tenderFilterReducer = (state: TenderFilterState, action: TenderFilterAction): TenderFilterState => {
  switch (action.type) {
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        isFiltering: true
      };
    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: initialState.filters,
        isFiltering: false
      };
    case 'SET_IS_FILTERING':
      return {
        ...state,
        isFiltering: action.payload
      };
    default:
      return state;
  }
};

const TenderFilterContext = createContext<TenderFilterContextType | undefined>(undefined);

export const TenderFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tenderFilterReducer, initialState);

  return (
    <TenderFilterContext.Provider value={{ state, dispatch }}>
      {children}
    </TenderFilterContext.Provider>
  );
};

export const useTenderFilter = () => {
  const context = useContext(TenderFilterContext);
  if (context === undefined) {
    throw new Error('useTenderFilter must be used within a TenderFilterProvider');
  }
  return context;
};