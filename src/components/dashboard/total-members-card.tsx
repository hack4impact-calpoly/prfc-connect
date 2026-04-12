import { StatCard } from "./stat-card";

const MEMBER_CAPACITY = 500;

function TargetIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="22" fill="#F5C35A" />
      <circle cx="32" cy="32" r="14" fill="#F5A442" />
      <circle cx="32" cy="32" r="6" fill="#E85730" />
      <line x1="14" y1="50" x2="32" y2="32" stroke="#231F1F" strokeWidth="3" strokeLinecap="round" />
      <polygon points="10,54 14,50 18,54 14,48" fill="#231F1F" />
    </svg>
  );
}

type Props = { count: number };

export function TotalMembersCard({ count }: Props) {
  return (
    <StatCard
      label="Total Members"
      value={`${count}/${MEMBER_CAPACITY}`}
      icon={<TargetIcon />}
      viewAllHref="/referral-database"
    />
  );
}
