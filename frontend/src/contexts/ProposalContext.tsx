// // /src/contexts/ProposalContext.tsx
// import React, { createContext, useContext, useReducer, ReactNode } from 'react';
// import { Proposal } from '@/services/proposalService';

// interface ProposalState {
//   proposals: Proposal[];
//   selectedProposal: Proposal | null;
//   loading: boolean;
//   error: string | null;
// }

// type ProposalAction =
//   | { type: 'SET_PROPOSALS'; payload: Proposal[] }
//   | { type: 'SET_SELECTED_PROPOSAL'; payload: Proposal | null }
//   | { type: 'ADD_PROPOSAL'; payload: Proposal }
//   | { type: 'UPDATE_PROPOSAL'; payload: Proposal }
//   | { type: 'DELETE_PROPOSAL'; payload: string }
//   | { type: 'SET_LOADING'; payload: boolean }
//   | { type: 'SET_ERROR'; payload: string | null };

// interface ProposalContextType {
//   state: ProposalState;
//   dispatch: React.Dispatch<ProposalAction>;
// }

// const initialState: ProposalState = {
//   proposals: [],
//   selectedProposal: null,
//   loading: false,
//   error: null
// };

// const proposalReducer = (state: ProposalState, action: ProposalAction): ProposalState => {
//   switch (action.type) {
//     case 'SET_PROPOSALS':
//       return { ...state, proposals: action.payload };
//     case 'SET_SELECTED_PROPOSAL':
//       return { ...state, selectedProposal: action.payload };
//     case 'ADD_PROPOSAL':
//       return { ...state, proposals: [action.payload, ...state.proposals] };
//     case 'UPDATE_PROPOSAL':
//       return {
//         ...state,
//         proposals: state.proposals.map(p =>
//           p._id === action.payload._id ? action.payload : p
//         ),
//         selectedProposal: state.selectedProposal?._id === action.payload._id ? action.payload : state.selectedProposal
//       };
//     case 'DELETE_PROPOSAL':
//       return {
//         ...state,
//         proposals: state.proposals.filter(p => p._id !== action.payload),
//         selectedProposal: state.selectedProposal?._id === action.payload ? null : state.selectedProposal
//       };
//     case 'SET_LOADING':
//       return { ...state, loading: action.payload };
//     case 'SET_ERROR':
//       return { ...state, error: action.payload };
//     default:
//       return state;
//   }
// };

// const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

// export const ProposalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   const [state, dispatch] = useReducer(proposalReducer, initialState);

//   return (
//     <ProposalContext.Provider value={{ state, dispatch }}>
//       {children}
//     </ProposalContext.Provider>
//   );
// };

// export const useProposalContext = () => {
//   const context = useContext(ProposalContext);
//   if (context === undefined) {
//     throw new Error('useProposalContext must be used within a ProposalProvider');
//   }
//   return context;
// };