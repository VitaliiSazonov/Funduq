export default function HomeLoading() {
  return (
    <div className="flex flex-col animate-pulse">
      {/* Hero Skeleton */}
      <section className="relative min-h-screen bg-charcoal flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-6 px-6">
          <div className="h-8 w-64 bg-white/5 rounded-full" />
          <div className="h-16 w-[500px] max-w-full bg-white/5 rounded-2xl" />
          <div className="h-12 w-[400px] max-w-full bg-white/5 rounded-2xl" />
          <div className="h-5 w-[450px] max-w-full bg-white/5 rounded-full mt-4" />
        </div>
      </section>

      {/* Featured Section Skeleton */}
      <section className="py-24 px-6 md:px-12 bg-offwhite">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div className="flex flex-col gap-4">
              <div className="h-4 w-32 bg-gold/10 rounded-full" />
              <div className="h-10 w-72 bg-charcoal/5 rounded-xl" />
            </div>
            <div className="h-5 w-40 bg-charcoal/5 rounded-full hidden md:block" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl overflow-hidden bg-white">
                <div className="aspect-[4/3] bg-charcoal/5" />
                <div className="p-6 flex flex-col gap-3">
                  <div className="h-5 w-3/4 bg-charcoal/5 rounded-full" />
                  <div className="h-4 w-1/2 bg-charcoal/5 rounded-full" />
                  <div className="h-4 w-1/3 bg-gold/10 rounded-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
