import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PurchaseReturn from '@pages/PurchaseReturn/PurchaseReturn';

const mockNavigate = jest.fn();
const mockGetEnrolments = jest.fn();
// Stable reference: PurchaseReturn re-verifies when searchParams changes, so a new object per render would loop
const mockSearchParams = new URLSearchParams('?session_id=cs_test_123');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}));

jest.mock('@services', () => ({
  EnrolmentService: { getEnrolments: (...args: unknown[]) => mockGetEnrolments(...args) },
}));

const enrolmentWith = (status: string) => ({
  id: 'enrol-123',
  enrolmentDateTime: '2025-01-15T10:00:00Z',
  product: { id: 'p1', name: 'HST', fee: { country: 'AUS', currency: 'AUD', basePrice: 89 } },
  payment: { checkoutSessionId: 'cs_test_123', status, amount: 89, currency: 'AUD' },
});

function renderPage() {
  return render(
    <MemoryRouter>
      <PurchaseReturn />
    </MemoryRouter>
  );
}

const noSelfServiceControls = () => {
  expect(
    screen.queryByRole('button', { name: /refund|cancel|reschedule/i })
  ).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /refund|cancel|reschedule/i })).not.toBeInTheDocument();
};

describe('PurchaseReturn payment states (MSP-2848)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('FAILED: shows a clear message and retries with the existing enrolment', async () => {
    const failed = enrolmentWith('FAILED');
    mockGetEnrolments.mockResolvedValue([failed]);

    renderPage();

    expect(await screen.findByText(/did not go through/i)).toBeInTheDocument();
    expect(screen.getByText(/other payment methods/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /try payment again/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/checkout', {
      replace: true,
      state: { retryEnrolment: failed },
    });
    noSelfServiceControls();
  });

  it('EXPIRED: explains the session expired and offers retry for the same enrolment', async () => {
    const expired = enrolmentWith('EXPIRED');
    mockGetEnrolments.mockResolvedValue([expired]);

    renderPage();

    expect(await screen.findByText(/payment session expired\. you can start/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /try payment again/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/checkout', {
      replace: true,
      state: { retryEnrolment: expired },
    });
  });

  it('PENDING: says confirmation is in progress, blocks a new payment, and rechecks status', async () => {
    mockGetEnrolments
      .mockResolvedValueOnce([enrolmentWith('PENDING')])
      .mockResolvedValueOnce([enrolmentWith('COMPLETED')]);

    renderPage();

    expect((await screen.findAllByText(/do not pay again/i)).length).toBeGreaterThan(0);
    expect(
      screen.queryByRole('button', { name: /try payment again|try again/i })
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /check payment status/i }));

    expect(await screen.findByText(/payment successful/i)).toBeInTheDocument();
    expect(mockGetEnrolments).toHaveBeenCalledTimes(2);
  });

  it('COMPLETED: shows success and does not offer another payment', async () => {
    mockGetEnrolments.mockResolvedValue([enrolmentWith('COMPLETED')]);

    renderPage();

    expect(await screen.findByText(/payment successful/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /try payment again|check payment status/i })
    ).not.toBeInTheDocument();
  });

  it('masks raw API errors when status lookup fails', async () => {
    mockGetEnrolments.mockRejectedValue(
      Object.assign(new Error('DynamoDB timeout arn:aws:xyz'), { status: 500 })
    );

    renderPage();

    expect(await screen.findByText(/could not check your payment status/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/dynamodb|arn:aws/i)).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /^try again$/i })).not.toBeInTheDocument();
  });

  it.each([
    ['no matching enrolment', []],
    ['unknown payment status', [enrolmentWith('SOMETHING_ELSE')]],
  ])(
    'fallback (%s): offers only the dashboard, never a new purchase',
    async (_label, enrolments) => {
      mockGetEnrolments.mockResolvedValue(enrolments);

      renderPage();

      await userEvent.click(await screen.findByRole('button', { name: /^dashboard$/i }));
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      expect(mockNavigate).not.toHaveBeenCalledWith('/book', expect.anything());
      expect(
        screen.queryByRole('button', { name: /try again|try payment again/i })
      ).not.toBeInTheDocument();
    }
  );

  it('shows MVP refund and reschedule guidance without a contact address', async () => {
    mockGetEnrolments.mockResolvedValue([enrolmentWith('FAILED')]);

    const { container } = renderPage();

    expect(await screen.findByText(/handled by the idp operations team/i)).toBeInTheDocument();
    expect(screen.getByText(/within 21 days of purchase/i)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/@/);
  });
});
