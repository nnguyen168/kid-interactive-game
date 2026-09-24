export default function StarBadge({ count }: { count: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-4 py-2 lg:px-6 lg:py-3 text-lg lg:text-2xl font-extrabold text-yellow-700 shadow-[0_3px_0_rgba(0,0,0,0.1)] whitespace-nowrap">
      ⭐ {count}
    </div>
  );
}
