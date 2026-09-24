export default function StarBadge({ count }: { count: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-4 py-2 text-lg font-extrabold text-yellow-700 shadow-sm whitespace-nowrap">
      ⭐ {count}
    </div>
  );
}
