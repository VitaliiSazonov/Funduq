"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Copy, Plus, RefreshCw, Trash2, Calendar as CalendarIcon, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { deleteCalendarFeed } from "@/app/actions/ical";

interface CalendarFeed {
  id: string;
  source_name: string;
  ical_url: string;
  last_synced_at: string | null;
}

interface BlockedDate {
  id: string;
  start_date: string;
  end_date: string;
  source: string;
  summary: string;
}

interface Props {
  propertyId: string;
  propertyTitle: string;
  initialFeeds: CalendarFeed[];
  blockedDates: BlockedDate[];
}

export default function CalendarSyncClient({ propertyId, propertyTitle, initialFeeds, blockedDates }: Props) {
  const router = useRouter();
  const t = useTranslations("calendarSync");
  
  const [isAdding, setIsAdding] = useState(false);
  const [sourceName, setSourceName] = useState("");
  const [icalUrl, setIcalUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Derive absolute URL for export
  const exportUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/calendar/${propertyId}` 
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(exportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/calendar/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          source_name: sourceName,
          ical_url: icalUrl
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("syncError"));
      }

      router.refresh();
      setIsAdding(false);
      setSourceName("");
      setIcalUrl("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncNow = async (feed: CalendarFeed) => {
    setSyncingId(feed.id);
    try {
      const res = await fetch('/api/calendar/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          source_name: feed.source_name,
          ical_url: feed.ical_url
        })
      });
      
      if (!res.ok) {
        throw new Error(t("syncError"));
      }

      router.refresh();
    } catch (err) {
      alert(t("syncError"));
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (feed: CalendarFeed) => {
    if (!confirm(t("confirmDelete"))) return;
    
    setDeletingId(feed.id);
    try {
      await deleteCalendarFeed(feed.id, propertyId, feed.source_name);
      router.refresh();
    } catch (err) {
      alert(t("deleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-charcoal/5">
        <Link href={`/host/properties/${propertyId}/edit`} className="p-3 hover:bg-charcoal/5 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-charcoal/60" />
        </Link>
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gold tracking-wider uppercase mb-1">
            <CalendarIcon className="w-3.5 h-3.5" />
            {t("title")}
          </div>
          <h1 className="text-3xl font-black text-charcoal display-font tracking-tight">{propertyTitle}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          
          {/* ─── Import Section ─── */}
          <div className="bg-white rounded-3xl border border-charcoal/5 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-charcoal/5 flex justify-between items-center bg-offwhite/30">
              <div>
                <h2 className="text-xl font-bold text-charcoal tracking-tight flex items-center gap-2">
                  {t("importTitle")}
                </h2>
                <p className="text-sm text-charcoal/60 mt-1">{t("importDesc")}</p>
              </div>
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="px-4 py-2.5 bg-charcoal text-white rounded-xl hover:bg-charcoal/90 transition-all flex items-center gap-2 text-sm font-bold shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t("addCalendar")}</span>
              </button>
            </div>

            <div className="p-6 sm:p-8">
              {isAdding && (
                <form onSubmit={handleAddFeed} className="mb-8 p-6 bg-offwhite border border-charcoal/5 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="grid gap-5 sm:grid-cols-2 mb-5">
                    <div>
                      <label className="block text-xs font-bold text-charcoal/60 uppercase tracking-wider mb-2">{t("sourceName")}</label>
                      <input
                        type="text"
                        required
                        placeholder={t("sourceNamePlaceholder")}
                        value={sourceName}
                        onChange={(e) => setSourceName(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-charcoal/10 rounded-xl font-medium text-charcoal focus:ring-2 focus:ring-gold/40 focus:outline-none transition-all placeholder:text-charcoal/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-charcoal/60 uppercase tracking-wider mb-2">{t("icalUrl")}</label>
                      <input
                        type="url"
                        required
                        placeholder="https://..."
                        value={icalUrl}
                        onChange={(e) => setIcalUrl(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-charcoal/10 rounded-xl font-medium text-charcoal focus:ring-2 focus:ring-gold/40 focus:outline-none transition-all placeholder:text-charcoal/30"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-5 py-2.5 text-sm font-bold text-charcoal/70 bg-transparent hover:bg-charcoal/5 rounded-xl transition-colors"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 text-sm font-bold text-white bg-gold hover:bg-gold-dark rounded-xl shadow-sm disabled:opacity-50 transition-all"
                    >
                      {isSubmitting ? t("connecting") : t("connect")}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {initialFeeds.length === 0 && !isAdding && (
                  <div className="text-center py-12 border-2 border-dashed border-charcoal/10 rounded-2xl bg-offwhite/30">
                    <CalendarIcon className="w-10 h-10 text-charcoal/20 mx-auto mb-3" />
                    <p className="text-sm font-medium text-charcoal/50">{t("noCalendars")}</p>
                  </div>
                )}
                {initialFeeds.map((feed) => (
                  <div key={feed.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-charcoal/10 rounded-2xl hover:border-gold/30 transition-all hover:shadow-md relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gold/20 group-hover:bg-gold transition-colors" />
                    
                    <div className="pl-2">
                      <h3 className="font-bold text-charcoal text-lg capitalize">{feed.source_name}</h3>
                      <div className="flex flex-col gap-1 mt-1 text-sm">
                        <div className="flex items-center gap-1.5 text-charcoal/50">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[200px] sm:max-w-xs font-mono text-xs">{feed.ical_url}</span>
                        </div>
                        <span className="text-charcoal/40 text-xs font-medium">
                          {feed.last_synced_at 
                            ? t("lastSynced", { time: new Date(feed.last_synced_at).toLocaleString() })
                            : t("neverSynced")
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:pl-4">
                      <button
                        onClick={() => handleSyncNow(feed)}
                        disabled={!!syncingId}
                        className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-charcoal bg-offwhite hover:bg-charcoal/5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncingId === feed.id ? 'animate-spin' : ''}`} />
                        {syncingId === feed.id ? t("syncing") : t("syncNow")}
                      </button>
                      <button
                        onClick={() => handleDelete(feed)}
                        disabled={!!deletingId}
                        className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                        title={t("deleteFeed")}
                      >
                        <Trash2 className={`w-4 h-4 ${deletingId === feed.id ? 'animate-pulse' : ''}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Blocked Dates Log ─── */}
          <div className="bg-white rounded-3xl border border-charcoal/5 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-charcoal/5 bg-offwhite/30">
              <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-charcoal/40" />
                {t("blockedDatesTitle")}
              </h2>
            </div>
            <div className="p-6">
              {blockedDates.length === 0 ? (
                <p className="text-sm text-charcoal/50 text-center py-8 italic">{t("noBlockedDates")}</p>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-offwhite text-charcoal/50 border-b border-charcoal/5">
                      <tr>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs">{t("tableSource")}</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs">{t("tableStart")}</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs">{t("tableEnd")}</th>
                        <th className="px-4 py-3 font-bold uppercase tracking-wider text-xs">{t("tableDetails")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-charcoal/5">
                      {blockedDates.map((block) => (
                        <tr key={block.id} className="hover:bg-offwhite/50 transition-colors">
                          <td className="px-4 py-4 capitalize font-bold text-charcoal">{block.source}</td>
                          <td className="px-4 py-4 text-charcoal/70 font-medium">{format(new Date(block.start_date), 'MMM d, yyyy')}</td>
                          <td className="px-4 py-4 text-charcoal/70 font-medium">{format(new Date(block.end_date), 'MMM d, yyyy')}</td>
                          <td className="px-4 py-4 text-charcoal/50 italic truncate max-w-[150px]">{block.summary || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Sidebar ─── */}
        <div className="space-y-6">
          {/* ─── Export Section ─── */}
          <div className="bg-white p-6 rounded-3xl border-2 border-gold/20 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-gold/5 rounded-full blur-xl" />
            
            <h2 className="text-lg font-bold text-charcoal mb-2 flex items-center gap-2 relative">
              <span className="w-2 h-2 bg-gold rounded-full" />
              {t("exportTitle")}
            </h2>
            <p className="text-sm text-charcoal/60 mb-5 relative leading-relaxed">
              {t("exportDesc")}
            </p>
            <div className="space-y-3 relative">
              <div className="p-3 bg-offwhite border border-charcoal/10 rounded-xl text-xs font-mono text-charcoal/60 break-all select-all cursor-pointer overflow-hidden">
                {exportUrl}
              </div>
              <button
                onClick={handleCopy}
                className={`w-full py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-sm ${
                  copied 
                  ? "bg-green-50 text-green-600 border border-green-200" 
                  : "bg-charcoal text-white hover:bg-charcoal/90"
                }`}
              >
                <Copy className="w-4 h-4" />
                {copied ? t("copied") : t("copyUrl")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
