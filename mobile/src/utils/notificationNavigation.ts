// src/utils/notificationNavigation.ts
import { CommonActions } from '@react-navigation/native';
import type { NotificationData } from '../types/notification';

let navigationRef: any = null;

export const setNavigationRef = (ref: any) => {
  navigationRef = ref;
};

export const navigateFromNotification = (data: NotificationData): void => {
  if (!data.screen || !navigationRef) return;

  const { screen, entityId } = data;

  try {
    switch (screen) {
      case 'JobDetail':
        navigationRef.dispatch(
          CommonActions.navigate('CandidateRoot', {
            screen: 'JobDetail',
            params: { jobId: entityId },
          })
        );
        break;

      case 'PostDetail':
        navigationRef.dispatch(
          CommonActions.navigate('CandidateRoot', {
            screen: 'Social',
            params: {
              screen: 'PostDetail',
              params: { postId: entityId },
            },
          })
        );
        break;

      case 'Profile':
        navigationRef.dispatch(
          CommonActions.navigate('CandidateRoot', {
            screen: 'Social',
            params: {
              screen: 'PublicProfile',
              params: { userId: entityId },
            },
          })
        );
        break;

      case 'ChatDetail':
        navigationRef.dispatch(
          CommonActions.navigate('CandidateRoot', {
            screen: 'Chat',
            params: {
              screen: 'Conversation',
              params: { conversationId: entityId },
            },
          })
        );
        break;

      case 'TenderDetail':
        navigationRef.dispatch(
          CommonActions.navigate('CompanyRoot', {
            screen: 'TenderDetail',
            params: { tenderId: entityId },
          })
        );
        break;

      case 'TenderProposals':
        navigationRef.dispatch(
          CommonActions.navigate('CompanyRoot', {
            screen: 'TenderProposals',
            params: { tenderId: entityId },
          })
        );
        break;

      case 'MyBids':
        navigationRef.dispatch(
          CommonActions.navigate('CompanyRoot', {
            screen: 'MyBids',
          })
        );
        break;

      case 'MyProposals':
        navigationRef.dispatch(
          CommonActions.navigate('FreelancerRoot', {
            screen: 'MyProposals',
          })
        );
        break;

      case 'MyApplications':
        navigationRef.dispatch(
          CommonActions.navigate('CandidateRoot', {
            screen: 'MyApplications',
          })
        );
        break;

      case 'VerificationStatus':
        navigationRef.dispatch(
          CommonActions.navigate('CandidateRoot', {
            screen: 'Verification',
          })
        );
        break;

      case 'AppointmentDetail':
        navigationRef.dispatch(
          CommonActions.navigate('CandidateRoot', {
            screen: 'AppointmentDetail',
            params: { appointmentId: entityId },
          })
        );
        break;

      case 'ReferralStats':
        navigationRef.dispatch(
          CommonActions.navigate('CandidateRoot', {
            screen: 'Referrals',
          })
        );
        break;

      case 'Home':
      default:
        // Navigate based on role if needed, or just go to main tabs
        break;
    }
  } catch (error) {
    console.warn('Navigation from notification failed:', error);
  }
};