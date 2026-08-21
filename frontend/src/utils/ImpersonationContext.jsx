import { createContext, useContext, useState } from 'react';

const ImpersonationContext = createContext(null);

/**
 * Provides impersonation state.
 * When active, the student auth context should reflect the impersonated student.
 */
export function ImpersonationProvider({ children }) {
  const [impersonated, setImpersonated] = useState(null); // { byuId, name, email }

  const impersonate = (student) => {
    setImpersonated({
      byuId:  student.byuId,
      name:   student.name,
      email:  student.email || '',
    });
  };

  const stopImpersonating = () => {
    setImpersonated(null);
  };

  const isImpersonating = impersonated !== null;

  return (
    <ImpersonationContext.Provider value={{ impersonated, isImpersonating, impersonate, stopImpersonating }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const ctx = useContext(ImpersonationContext);
  if (!ctx) throw new Error('useImpersonation must be used within ImpersonationProvider');
  return ctx;
}
