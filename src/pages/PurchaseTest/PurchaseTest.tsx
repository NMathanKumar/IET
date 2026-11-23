import { useState } from 'react';
import { Link } from 'react-router-dom';

const faqs = [
  { q: 'How long is the test?', a: '~80 minutes, uninterrupted. Four skills: Reading, Listening, Writing, and Speaking in one sitting.' },
  { q: 'When do I get my results?', a: 'Results are ready within 48 hours, reviewed by certified human assessors.' },
  { q: 'How many times can I take the test?', a: 'You can only take this test once per purchase. Practice tests are available for free.' },
  { q: 'Where is the test accepted?', a: 'Over 2,000 institutions and organisations worldwide.' },
];

const TEST_FEATURES = ['Four skills, one sitting', 'Results in 48 hours', 'Certified in days', 'Recognised worldwide'];
const PRACTICE_FEATURES = [
  'Practise all four skills',
  'Get an estimated score',
  'Complete the test in your own time',
  'Feel more confident on test day',
];

export default function PurchaseTest() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <div className="max-w-[900px] mx-auto pb-12">
        {/* Hero Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7">
          {/* Test Card */}
          <div className="bg-surface-brand rounded-[16px] px-8 py-7 text-ink border border-accent-yellow shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex flex-col">
            <p className="text-[11px] font-bold text-ink uppercase tracking-[0.1em] mb-3">
              IDP English Test
            </p>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-[48px] font-black leading-[1] text-brand-primary">
                $89
              </span>
              <span className="text-[16px] text-slate pb-1.5">
                AUD
              </span>
            </div>
            <div className="flex flex-col gap-2 mb-6 flex-1">
              {TEST_FEATURES.map((f) => (
                <div
                  key={f}
                  className="flex items-center gap-2 text-[13px] text-slate"
                >
                  <span className="text-brand-primary font-black">✓</span>
                  {f}
                </div>
              ))}
            </div>
            <Link
              to="/checkout"
              className="block text-center w-full py-3 rounded-[10px] border-none bg-brand-primary text-white text-[14px] font-black no-underline hover:opacity-90 transition-opacity"
            >
              Purchase Test →
            </Link>
          </div>

          {/* Practice Card */}
          <div className="bg-surface-light rounded-[16px] px-8 py-7 border border-border-alt flex flex-col">
            <p className="text-[22px] font-black text-ink mb-1">
              Practice for free
            </p>
            <p className="text-[13px] text-slate mb-5 leading-[1.6]">
              See what the test is like before test day. Take a full practice test, receive an
              estimated score, and go at your own pace.
            </p>
            <p className="text-[11px] font-bold text-ink uppercase tracking-[0.08em] mb-2.5">
              What&apos;s included
            </p>
            <div className="flex flex-col gap-2 mb-6 flex-1">
              {PRACTICE_FEATURES.map((f) => (
                <div
                  key={f}
                  className="flex items-center gap-2 text-[12px] text-slate"
                >
                  <span className="text-brand-primary">→</span>
                  {f}
                </div>
              ))}
            </div>
            <Link
              to="/practice"
              className="block text-center py-3 rounded-[10px] border-[1.5px] border-border-alt bg-white text-ink text-[14px] font-bold no-underline hover:bg-[#f9f9f9] transition-colors"
            >
              Start free practice →
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-[16px] border border-border-alt px-7 py-6">
          <h2 className="text-[16px] font-black text-ink mb-4">
            Frequently asked questions
          </h2>
          <div className="flex flex-col gap-0">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={faq.q}
                  className={i < faqs.length - 1 ? 'border-b border-border-alt' : ''}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full text-left py-4 bg-none border-none text-[14px] font-bold text-ink cursor-pointer flex items-center justify-between outline-none hover:text-brand-primary transition-colors"
                  >
                    {faq.q}
                    <span aria-hidden="true" className="text-slate text-[16px]">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <p
                      id={`faq-answer-${i}`}
                      className="text-[13px] text-slate leading-[1.7] pb-4"
                    >
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
