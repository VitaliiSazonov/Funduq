import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHostProperties } from "@/app/actions/properties";
import HostPropertyCard from "@/components/host/HostPropertyCard";
import Link from "next/link";
import { Plus, CalendarDays, LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";

export default async function HostDashboardPage() {
  const supabase = await createClient();

  // Verify user session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const properties = await getHostProperties();

  return (
    <div className="min-h-screen bg-offwhite pt-12 pb-32 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div className="flex flex-col gap-4">
            <span className="text-sm font-black text-gold uppercase tracking-[0.2em] display-font">Properties Owned</span>
            <h1 className="text-4xl md:text-5xl font-black text-charcoal display-font tracking-tight">Host Dashboard</h1>
            <p className="text-muted font-medium max-w-lg">Manage your luxury listings, track performance, and welcome your next guests.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/host/bookings"
              className="flex items-center gap-3 bg-white text-charcoal border border-charcoal/10 px-8 py-4 rounded-full font-black hover:border-gold hover:text-gold transition-all duration-300 group"
            >
              <CalendarDays className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Bookings</span>
            </Link>
            <Link 
              href="/host/properties/new" 
              className="flex items-center gap-3 bg-charcoal text-white px-8 py-4 rounded-full font-black hover:bg-gold transition-all duration-300 luxury-shadow group"
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>List New Property</span>
            </Link>
          </div>
        </header>

        {/* User Greeting */}
        <div className="bg-white/50 border border-gray-100 rounded-3xl p-8 mb-12 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center text-gold font-black">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-charcoal">Welcome back, {user.email?.split('@')[0]}!</h2>
                    <p className="text-sm text-muted">You have {properties.length} active listings on Funduq.</p>
                </div>
            </div>
            <div className="flex items-center gap-4 hidden md:flex">
                <div className="text-right">
                    <span className="text-[10px] uppercase font-black tracking-widest text-muted block mb-1">Status</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase">Verified Host</span>
                </div>
                <form action={signOutAction}>
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-charcoal/10 text-charcoal/50 text-xs font-bold uppercase tracking-wider hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all duration-300 cursor-pointer"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                    </button>
                </form>
            </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {properties.length > 0 ? (
            properties.map((property) => (
              <HostPropertyCard key={property.id} {...property} />
            ))
          ) : (
            <div className="col-span-full py-40 flex flex-col items-center text-center bg-white rounded-3xl border border-dashed border-gray-200">
               <div className="w-20 h-20 bg-offwhite rounded-full flex items-center justify-center mb-6">
                  <Plus className="w-8 h-8 text-muted" />
               </div>
               <h3 className="text-xl font-bold text-charcoal mb-2">No listings yet</h3>
               <p className="text-muted max-w-xs mb-8">Start your journey as a host by listing your first luxury property today.</p>
               <Link href="/host/properties/new" className="text-gold font-bold hover:underline">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
