export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff6b35] to-[#ff8c5a] flex items-center justify-center animate-pulse">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="text-gradient text-xl font-bold">RestroDyn</div>
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    </div>
  );
}