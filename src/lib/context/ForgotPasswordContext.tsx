import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface ForgotPasswordContextType {
  email: string;
  setEmail: (email: string) => void;
  step: 'email' | 'otp' | 'reset';
  setStep: (step: 'email' | 'otp' | 'reset') => void;
}

const ForgotPasswordContext = createContext<ForgotPasswordContextType | undefined>(undefined);

export const ForgotPasswordProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');

  return (
    <ForgotPasswordContext.Provider value={{ email, setEmail, step, setStep }}>
      {children}
    </ForgotPasswordContext.Provider>
  );
};

export const useForgotPassword = (): ForgotPasswordContextType => {
  const context = useContext(ForgotPasswordContext);
  if (!context) {
    throw new Error('useForgotPassword must be used within a ForgotPasswordProvider');
  }
  return context;
};
