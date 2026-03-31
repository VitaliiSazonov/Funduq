export default function VillasLoading() {
  return (
    <div className="min-h-screen bg-offwhite flex flex-col animate-pulse">
      {/* Header Skeleton */}
      <section className="bg-charcoal pt-32 pb-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <div className="h-12 w-80 bg-white/5 rounded-2xl" />
          <div className="h-5 w-96 max-w-full bg-white/5 rounded-full" />
        </div>
      </section>

      {/* Filters Skeleton */}
      <div className="max-w-7xl mx-auto w-full px-6 md:px-12 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-10 w-28 bg-charcoal/5 rounded-full" />
          <div className="h-10 w-28 bg-charcoal/5 rounded-full" />
          <div className="h-10 w-28 bg-charcoal/5 rounded-full" />
          <div className="h-10 w-28 bg-charcoal/5 rounded-full hidden md:block" />
          <div className="ml-auto h-10 w-48 bg-charcoal/5 rounded-xl hidden md:block" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-3xl overflow-hidden bg-white">
              <div className="aspect-[4/3] bg-charcoal/5" />
              <div className="p-5 flex flex-col gap-3">
                <div className="h-5 w-3/4 bg-charcoal/5 rounded-full" />
                <div className="h-4 w-1/2 bg-charcoal/5 rounded-full" />
                <div className="flex items-center gap-4 mt-1">
                  <div className="h-3 w-16 bg-charcoal/5 rounded-full" />
                  <div className="h-3 w-16 bg-charcoal/5 rounded-full" />
                </div>
                <div className="h-5 w-24 bg-gold/10 rounded-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
