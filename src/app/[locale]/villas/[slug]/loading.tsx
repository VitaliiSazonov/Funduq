export default function VillaDetailLoading() {
  return (
    <div className="min-h-screen bg-offwhite animate-pulse">
      {/* Gallery Skeleton */}
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-3xl overflow-hidden">
            <div className="md:col-span-2 md:row-span-2 aspect-[4/3] bg-charcoal/5" />
            <div className="aspect-square bg-charcoal/5 hidden md:block" />
            <div className="aspect-square bg-charcoal/5 hidden md:block" />
            <div className="aspect-square bg-charcoal/5 hidden md:block" />
            <div className="aspect-square bg-charcoal/5 hidden md:block" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <div className="h-8 w-2/3 bg-charcoal/5 rounded-xl" />
              <div className="h-5 w-1/3 bg-charcoal/5 rounded-full" />
              <div className="flex gap-4 mt-2">
                <div className="h-10 w-24 bg-charcoal/5 rounded-full" />
                <div className="h-10 w-24 bg-charcoal/5 rounded-full" />
                <div className="h-10 w-24 bg-charcoal/5 rounded-full" />
              </div>
            </div>
            <div className="h-px bg-charcoal/5" />
            <div className="flex flex-col gap-3">
              <div className="h-4 w-full bg-charcoal/5 rounded-full" />
              <div className="h-4 w-full bg-charcoal/5 rounded-full" />
              <div className="h-4 w-3/4 bg-charcoal/5 rounded-full" />
              <div className="h-4 w-5/6 bg-charcoal/5 rounded-full" />
            </div>
            <div className="h-px bg-charcoal/5" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-12 bg-charcoal/5 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Right Column — Booking Widget */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border border-charcoal/5 p-8 flex flex-col gap-6 sticky top-28">
              <div className="h-8 w-32 bg-gold/10 rounded-full" />
              <div className="h-12 w-full bg-charcoal/5 rounded-xl" />
              <div className="h-12 w-full bg-charcoal/5 rounded-xl" />
              <div className="h-14 w-full bg-charcoal/10 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
