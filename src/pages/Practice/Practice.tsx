import { Link } from 'react-router-dom';
import AppIcon from '@components/AppIcon';

type Skill = 'Listening' | 'Reading' | 'Speaking' | 'Writing';

const skills: Skill[] = ['Listening', 'Reading', 'Speaking', 'Writing'];

const skillBgColors: Record<Skill, string> = {
  Listening: 'bg-surface-info-light',
  Reading: 'bg-surface-success-light',
  Speaking: 'bg-surface-warning-light',
  Writing: 'bg-[#f3e5f5]',
};

const skillTextColors: Record<Skill, string> = {
  Listening: 'text-info-dark',
  Reading: 'text-success',
  Speaking: 'text-warning',
  Writing: 'text-[#7b1fa2]',
};

export default function Practice() {
  return (
    <div className="max-w-[900px] mx-auto pb-12">
      {/* Coming Soon Card */}
      <div className="bg-white border border-border-default rounded-[16px] px-7 py-7 mb-8">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Clock Icon in soft orange tile */}
          <div className="flex-shrink-0 w-14 h-14 rounded-[12px] bg-brand-primary/10 flex items-center justify-center">
            <AppIcon name="clock" size={24} className="text-brand-primary" />
          </div>

          <div className="flex-1">
            <h2 className="text-[18px] font-black text-ink mb-2">Practice is coming soon</h2>
            <p className="text-[14px] text-slate mb-6">
              Soon you&apos;ll be able to practise each skill and take a short practice test. Until
              then, learn what to expect on test day.
            </p>

            <Link
              to="/test-prepare"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-[10px] border-[1.5px] border-brand-primary text-brand-primary text-[13px] font-bold no-underline transition-all hover:bg-brand-primary/5"
            >
              How the test works
            </Link>
          </div>
        </div>
      </div>

      {/* What's coming section */}
      <div>
        <h2 className="text-[16px] font-black text-ink mb-6">What&apos;s coming</h2>

        {/* Featured test tile */}
        <div
          className="border border-solid border-brand-primary/20 bg-[#fff8f1] rounded-[14px] px-6 py-5 mb-6"
          aria-disabled="true"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <p className="text-[11px] font-bold text-brand-primary uppercase tracking-[0.08em] mb-2">
                Four Skills Practice Test
              </p>
              <h3 className="text-[16px] font-black text-ink mb-2">Try a short test</h3>
              <p className="text-[13px] text-slate">
                ~45 minutes · Reading · Listening · Writing · Speaking · An indicative score, for practice only
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-brand-primary text-white text-[11px] font-bold uppercase tracking-[0.05em]">
                Coming soon
              </span>
            </div>
          </div>
        </div>

        {/* Four skills grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((skill) => (
            <div
              key={skill}
              className="border border-dashed border-border-default bg-muted rounded-[14px] px-5 py-4"
              aria-disabled="true"
            >
              <div className="flex items-start justify-between mb-3">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.05em] ${skillBgColors[skill]} ${skillTextColors[skill]}`}
                >
                  {skill}
                </span>
              </div>
              <h3 className="text-[13px] font-bold text-ink mb-1">{skill} practice</h3>
              <p className="text-[12px] text-slate">Short tasks in the real test format</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
