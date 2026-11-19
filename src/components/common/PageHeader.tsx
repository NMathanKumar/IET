import { Link } from 'react-router-dom';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
}

export default function PageHeader({
  title,
  subtitle,
  backTo,
  backLabel = '← Back to Dashboard',
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {backTo && (
          <Link
            to={backTo}
            className="text-[13px] text-[#55657b] no-underline font-semibold"
          >
            {backLabel}
          </Link>
        )}
        <h1 className="text-[24px] font-black text-[#232d3f] mt-2 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[14px] text-[#55657b] mt-1">
            {subtitle}
          </p>
        )}
      </div>
      <Link
        to="/book"
        className="w-full sm:w-auto sm:flex-shrink-0 px-4 py-2 rounded-lg bg-[#eb7900] text-white text-[12px] font-black no-underline whitespace-nowrap text-center"
      >
        Purchase a Test →
      </Link>
    </div>
  );
}
