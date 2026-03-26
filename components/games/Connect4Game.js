// TEZ Connect 4 — placeholder until real game code is pasted in

export default function Connect4Game({ mode }) {
  if (mode === 'rumble') {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 text-center">
        <div className="text-6xl">🔒</div>
        <h2 className="font-fredoka text-3xl font-semibold text-gray-400">Rumble Mode</h2>
        <p className="font-nunito text-gray-400">This mode is coming soon. Stay tuned!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-4 text-center">
      <div className="flex gap-2 text-5xl animate-float">
        <span>🔴</span>
        <span>🟡</span>
      </div>
      <h2 className="font-fredoka text-3xl font-semibold text-orange-500">TEZ Connect 4</h2>
      <p className="font-nunito text-gray-500 max-w-md">
        {mode === 'normal'
          ? 'Normal Mode — Paste in the Connect 4 component to start playing!'
          : 'Select a mode above to play!'}
      </p>
      {/* Grid preview */}
      <div className="grid grid-cols-7 gap-2 mt-4">
        {Array.from({ length: 42 }).map((_, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full bg-orange-100 border-2 border-orange-200"
          />
        ))}
      </div>
    </div>
  );
}
