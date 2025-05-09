import React, { Suspense } from 'react';
import EmployeeOnboarding from './onboarding';

export default function OnboardingPage() {
  return (
    <Suspense>
        <EmployeeOnboarding />
    </Suspense>
  );
}
