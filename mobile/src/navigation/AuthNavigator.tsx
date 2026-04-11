// ─────────────────────────────────────────────────────────────────────────────
// navigation/AuthNavigator.tsx  (unchanged but shown for completeness)
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { OnboardingScreen }                         from '../screens/auth/OnboardingScreen';
import { LoginScreen }                              from '../screens/auth/LoginScreen';
import { RegisterScreen }                           from '../screens/auth/RegisterScreen';
import { RoleSelectScreen }                         from '../screens/auth/RoleSelectScreen';
import { OtpVerifyScreen }                          from '../screens/auth/OtpVerifyScreen';
import { ForgotPasswordScreen }                     from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen }                      from '../screens/auth/ResetPasswordScreen';
import { PhoneRegisterScreen, PhoneOtpScreen }      from '../screens/auth/PhoneScreen';

export type AuthStackParamList = {
  Onboarding:     undefined;
  Login:          undefined;
  Register:       undefined;
  RoleSelect:     undefined;
  OtpVerify:      { email: string };
  ForgotPassword: undefined;
  ResetPassword:  { email: string };
  PhoneRegister:  undefined;
  PhoneOtp:       { phone: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => (
  <Stack.Navigator
    initialRouteName="Onboarding"
    screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
  >
    <Stack.Screen name="Onboarding"     component={OnboardingScreen} />
    <Stack.Screen name="Login"          component={LoginScreen} />
    <Stack.Screen name="Register"       component={RegisterScreen} />
    <Stack.Screen name="RoleSelect"     component={RoleSelectScreen} />
    <Stack.Screen name="OtpVerify"      component={OtpVerifyScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword"  component={ResetPasswordScreen} />
    <Stack.Screen name="PhoneRegister"  component={PhoneRegisterScreen} />
    <Stack.Screen name="PhoneOtp"       component={PhoneOtpScreen} />
  </Stack.Navigator>
);