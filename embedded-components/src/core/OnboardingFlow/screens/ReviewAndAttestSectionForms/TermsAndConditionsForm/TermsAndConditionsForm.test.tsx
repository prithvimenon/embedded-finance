import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TermsAndConditionsForm } from './TermsAndConditionsForm';

vi.mock('@/core/OnboardingFlow/contexts', () => ({
  useOnboardingContext: () => ({
    clientData: {
      id: 'client-1',
      parties: [
        {
          id: 'party-1',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER'],
          active: true,
          individualDetails: { firstName: 'John' },
        },
      ],
      outstanding: {
        questionIds: [],
        attestationDocumentIds: ['doc-1'],
      },
      questionResponses: [],
    },
    onPostClientSettled: vi.fn(),
  }),
}));

vi.mock('@/core/OnboardingFlow/hooks/useFlowUnsavedChangesSync', () => ({
  useFlowUnsavedChangesSync: vi.fn(),
}));

vi.mock('@/lib/hooks', () => ({
  useIPAddress: () => ({ data: '127.0.0.1' }),
}));

vi.mock('@/api/generated/smbdo', () => ({
  useSmbdoUpdateClientLegacy: () => ({
    mutateAsync: vi.fn(),
    error: null,
    status: 'idle',
  }),
  useSmbdoPostClientVerifications: () => ({
    mutateAsync: vi.fn(),
    error: null,
    status: 'idle',
  }),
  getSmbdoGetClientQueryKey: () => ['client'],
  smbdoGetDocumentDetail: vi.fn(),
  smbdoDownloadDocument: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
  useQueries: () => [
    {
      data: { id: 'doc-1', documentType: 'Terms of Service' },
      isFetching: false,
    },
  ],
}));

vi.mock('@/i18n', () => ({
  useTranslationWithTokens: () => ({
    t: (key: string | string[], opts?: any) => {
      if (opts?.defaultValue) return opts.defaultValue;
      const k = Array.isArray(key) ? key[0] : key;
      if (k.includes('documentAttestation')) return 'Document attestation';
      if (k.includes('agreeToDocuments'))
        return 'I have read and agree to all of the documents listed on this page';
      if (k.includes('mustReviewDocuments'))
        return 'You must open and review all documents';
      if (k === 'common:loading') return 'Loading...';
      return k;
    },
    tString: (key: string | string[]) => (Array.isArray(key) ? key[0] : key),
  }),
}));

vi.mock('@/components/ServerErrorAlert', () => ({
  ServerErrorAlert: () => null,
}));

describe('TermsAndConditionsForm', () => {
  const defaultProps = {
    handlePrev: vi.fn(),
    handleNext: vi.fn(),
    getPrevButtonLabel: () => 'Previous',
    getNextButtonLabel: () => 'Agree and finish',
  };

  it('renders without crashing', () => {
    render(<TermsAndConditionsForm {...defaultProps} />);
    expect(document.querySelector('form')).toBeInTheDocument();
  });

  it('renders the attestation checkbox', () => {
    render(<TermsAndConditionsForm {...defaultProps} />);
    expect(screen.getByText(/Document attestation/i)).toBeInTheDocument();
    expect(
      screen.getByText(/I have read and agree to all of the documents/i)
    ).toBeInTheDocument();
  });

  it('renders the informational alert about reviewing documents', () => {
    render(<TermsAndConditionsForm {...defaultProps} />);
    expect(
      screen.getByText(/You must open and review all documents/i)
    ).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<TermsAndConditionsForm {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: /Previous/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Agree and finish/i })
    ).toBeInTheDocument();
  });
});
