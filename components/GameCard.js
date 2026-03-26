import Link from 'next/link';

export default function GameCard({ game }) {
  return (
    <Link href={`/game/${game.slug}`} className="group block">
      <div
        className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-105 cursor-pointer bg-white border-2"
        style={{ borderColor: game.accentColor }}
      >
        {/* Thumbnail */}
        <div
          className="h-40 flex items-center justify-center text-7xl"
          style={{ background: game.gradient }}
        >
          {game.emoji}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-fredoka font-semibold text-xl text-gray-800 mb-1">{game.name}</h3>
          <p className="text-gray-500 font-nunito text-sm leading-snug">{game.description}</p>
        </div>

        {/* Play badge */}
        <div
          className="absolute top-3 right-3 text-white text-xs font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ backgroundColor: game.accentColor }}
        >
          Play →
        </div>
      </div>
    </Link>
  );
}
