interface Props {
    label: string;
    value: string | number;
    sub?: string;
    color?: 'blue' | 'green' | 'yellow' | 'red';
  }
  
  const colors = {
    blue: 'bg-brand-50 text-brand-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  };
  
  export default function KpiCard({ label, value, sub, color = 'blue' }: Props) {
    return (
      <div className={`rounded-xl p-5 ${colors[color]}`}>
        <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
        <p className="text-2xl font-semibold mt-1">{value}</p>
        {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
      </div>
    );
  }