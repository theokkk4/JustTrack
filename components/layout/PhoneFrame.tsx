import React from 'react';

/** Native: the app is the phone. (The web build draws an iPhone around it on wide screens — see PhoneFrame.web.tsx.) */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
