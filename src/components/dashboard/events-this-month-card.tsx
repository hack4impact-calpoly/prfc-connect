import { StatCard } from "./stat-card";

function CalendarStarIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      stroke="#5FDF7A"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="10" y="14" width="44" height="40" rx="4" />
      <line x1="20" y1="8" x2="20" y2="18" />
      <line x1="44" y1="8" x2="44" y2="18" />
      <line x1="10" y1="24" x2="54" y2="24" />
      <polygon points="40,34 43,40 50,41 45,46 46,53 40,50 34,53 35,46 30,41 37,40" fill="#5FDF7A" stroke="none" />
    </svg>
  );
}

type Props = { count: number };

export function EventsThisMonthCard({ count }: Props) {
  return <StatCard label="Events This Month" value={String(count)} icon={<CalendarStarIcon />} viewAllHref="/events" />;
}
