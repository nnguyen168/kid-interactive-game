import Art from "../Art";

export default function StarCounter({ count }: { count: number }) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full bg-white/90 py-1 pl-1.5 pr-4 lg:pr-6 shadow-[0_5px_0_rgba(0,0,0,0.12)]">
      <Art name="glowing-star" className="w-10 h-10 lg:w-12 lg:h-12" eager alt="étoiles" />
      <span key={count} className="bump inline-block min-w-[1.5ch] text-2xl lg:text-3xl font-bold text-amber-500">
        {count}
      </span>
    </div>
  );
}
