import React from 'react';

import { LegalPage } from '@/components/legal/LegalPage';
import { LEGAL_DATELINE, SUPPORT_INTRO, SUPPORT_SECTIONS } from '@/constants/legal';

export default function SupportScreen() {
  return <LegalPage title="Support" dateline={LEGAL_DATELINE} intro={SUPPORT_INTRO} sections={SUPPORT_SECTIONS} />;
}
