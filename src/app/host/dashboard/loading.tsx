export default function HostDashboardLoading() {
  return (
    <div className="min-h-screen bg-offwhite pt-12 pb-32 px-6 md:px-12 animate-pulse">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div className="flex flex-col gap-4">
            <div className="h-4 w-32 bg-gold/10 rounded-full" />
            <div className="h-12 w-72 bg-charcoal/5 rounded-2xl" />
            <div className="h-5 w-96 max-w-full bg-charcoal/5 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-14 w-36 bg-charcoal/5 rounded-full" />
            <div className="h-14 w-44 bg-charcoal/10 rounded-full" />
          </div>
        </header>

        {/* User Greeting Skeleton */}
        <div className="bg-white/50 border border-gray-100 rounded-3xl p-8 mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gold/10 rounded-full" />
            <div className="flex flex-col gap-2">
              <div className="h-5 w-48 bg-charcoal/5 rounded-full" />
              <div className="h-4 w-56 bg-charcoal/5 rounded-full" />
            </div>
          </div>
        </div>

        {/* Properties Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-3xl overflow-hidden bg-white">
              <div className="aspect-[4/3] bg-charcoal/5" />
              <div className="p-5 flex flex-col gap-3">
                <div className="h-5 w-3/4 bg-charcoal/5 rounded-full" />
                <div className="h-4 w-1/2 bg-charcoal/5 rounded-full" />
                <div className="h-4 w-1/3 bg-gold/10 rounded-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
