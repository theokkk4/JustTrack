import React from 'react';

import { LegalPage } from '@/components/legal/LegalPage';
import { LEGAL_DATELINE, PRIVACY_INTRO, PRIVACY_SECTIONS } from '@/constants/legal';

export default function PrivacyScreen() {
  return <LegalPage title="Privacy policy" dateline={LEGAL_DATELINE} intro={PRIVACY_INTRO} sections={PRIVACY_SECTIONS} />;
}
