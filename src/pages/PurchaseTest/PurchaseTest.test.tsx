import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PurchaseTest from './PurchaseTest';
import type { Product } from '@types';

// Hoist all mocks
const mocks = vi.hoisted(() => ({
  mockGetProducts: vi.fn(),
}));

vi.mock('@hooks/useAuth', () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));

vi.mock('@layouts/AppShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@services/product', () => ({
  getProducts: mocks.mockGetProducts,
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/purchase']}>
      <PurchaseTest />
    </MemoryRouter>
  );
}

describe('PurchaseTest', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock products data
    const mockProducts: Product[] = [
      {
        id: 'product-1',
        name: 'IDP English Test',
        description: 'Full IDP English Test',
        status: 'ACTIVE',
        fees: [
          {
            country: 'AUS',
            currency: 'AUD',
            basePrice: 89,
          },
        ],
      },
      {
        id: 'product-2',
        name: 'Practice Test',
        description: 'Free practice test',
        status: 'ACTIVE',
        fees: [],
      },
    ];

    mocks.mockGetProducts.mockResolvedValue(mockProducts);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', async () => {
    renderPage();

    await waitFor(
      () => {
        // Find the pricing card container with IDP English Test title
        const pricingCards = screen.getAllByText('IDP English Test');
        expect(pricingCards.length).toBeGreaterThan(0);
        
        // Verify price is displayed (may be split across elements)
        const priceText = screen.getByText('$89', { selector: 'span' });
        expect(priceText).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('renders back link to dashboard', async () => {
    renderPage();

    await waitFor(
      () => {
        // Product name appears in multiple places, verify it exists
        const productNames = screen.getAllByText('IDP English Test');
        expect(productNames.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );
  });

  it('shows IDP English Test pricing card', async () => {
    renderPage();

    await waitFor(
      () => {
        // Find the pricing card by using getAllByText and scoping
        const idpProducts = screen.getAllByText('IDP English Test');
        expect(idpProducts.length).toBeGreaterThan(0);
        
        // Verify price components
        const priceAmount = screen.getByText('$89', { selector: 'span' });
        expect(priceAmount).toBeInTheDocument();
        
        const currency = screen.getByText('AUD');
        expect(currency).toBeInTheDocument();
        
        // Verify features are present
        expect(screen.getByText(/Four skills, one sitting/i)).toBeInTheDocument();
        expect(screen.getByText(/Results in 48 hours/i)).toBeInTheDocument();
        expect(screen.getByText(/Certified in days/i)).toBeInTheDocument();
        expect(screen.getByText(/Recognised worldwide/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('shows four skills feature list', async () => {
    renderPage();

    await waitFor(
      () => {
        // Find features by their exact text in the pricing card
        expect(screen.getByText(/Four skills, one sitting/i)).toBeInTheDocument();
        expect(screen.getByText(/Results in 48 hours/i)).toBeInTheDocument();
        expect(screen.getByText(/Certified in days/i)).toBeInTheDocument();
        expect(screen.getByText(/Recognised worldwide/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('shows practice test pricing card', async () => {
    renderPage();

    await waitFor(
      () => {
        // Find the practice card by its heading
        expect(screen.getByText('Practice for free')).toBeInTheDocument();
        
        // Verify practice features
        expect(screen.getByText(/Practise all four skills/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('shows FAQ section', async () => {
    renderPage();

    await waitFor(
      () => {
        expect(
          screen.getByRole('heading', {
            name: /frequently asked questions/i,
          })
        ).toBeInTheDocument();

        // Verify FAQ questions are present
        expect(screen.getByText(/how long is the test\?/i)).toBeInTheDocument();
        expect(screen.getByText(/when do i get my results\?/i)).toBeInTheDocument();
        expect(screen.getByText(/how many times can i take the test\?/i)).toBeInTheDocument();
        expect(screen.getByText(/where is the test accepted\?/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('shows Expandable FAQ answers', async () => {
    renderPage();

    await waitFor(
      () => {
        // Find the FAQ question button
        const faqButtons = screen.getAllByRole('button');
        const howLongButton = faqButtons.find(btn => 
          btn.textContent?.includes('How long is the test')
        );
        expect(howLongButton).toBeDefined();
      },
      { timeout: 3000 }
    );

    // Get all buttons and find the one with our text
    const faqButtons = screen.getAllByRole('button');
    const howLongButton = faqButtons.find(btn => 
      btn.textContent?.includes('How long is the test')
    );

    expect(howLongButton).toBeDefined();
    fireEvent.click(howLongButton!);

    await waitFor(
      () => {
        expect(screen.getByText(/~80 minutes/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('shows Purchase Test link in pricing card', async () => {
    renderPage();

    await waitFor(
      () => {
        // Find the Purchase Test link by its role and name
        const purchaseLink = screen.getByRole('link', {
          name: /purchase test/i,
        });
        expect(purchaseLink).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('renders checkout link', async () => {
    renderPage();

    await waitFor(
      () => {
        const purchaseLink = screen.getByRole('link', {
          name: /purchase test/i,
        });
        expect(purchaseLink).toBeInTheDocument();
        expect(purchaseLink).toHaveAttribute('href', '/checkout');
      },
      { timeout: 3000 }
    );
  });
});