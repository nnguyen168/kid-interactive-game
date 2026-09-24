export default function HeartLives({ lives, max = 3 }: { lives: number; max?: number }) {
  return (
    <div className="flex gap-1 lg:gap-2 text-2xl lg:text-4xl" aria-label={`${lives} vies restantes`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i}>{i < lives ? "❤️" : "🤍"}</span>
      ))}
    </div>
  );
}
