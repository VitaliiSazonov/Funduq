"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Phone, Save } from "lucide-react";
import { setAdminComment } from "@/app/actions/booking-requests";
import { format, parseISO } from "date-fns";

export type AdminBookingRequest = {
  id: string;
  property_id: string;
  guest_name: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  total_guests: number;
  message: string | null;
  status: "Request" | "OnProcess" | "Confirmed" | "Checkout" | "Cancel";
  admin_comment: string | null;
  host_reply: "done" | "reject" | "contact_me" | null;
  host_id: string;
  created_at: string;
  properties: { title: string } | null;
};

function AdminCommentCell({ req }: { req: AdminBookingRequest }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState(req.admin_comment || "");

  const originalComment = req.admin_comment || "";
  const hasChanged = comment.trim() !== originalComment.trim();

  const handleSave = () => {
    startTransition(async () => {
      const result = await setAdminComment({
        id: req.id,
        admin_comment: comment.trim(),
      });
      if (!result.success) {
        console.error("Failed to save admin comment:", result.error);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-start gap-2">
      <textarea
        rows={2}
        maxLength={500}
        disabled={isPending}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="flex-1 border border-charcoal/10 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50 min-w-[150px] resize-y"
        placeholder="Add comment..."
      />
      <button
        disabled={!hasChanged || isPending}
        onClick={handleSave}
        className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
        title="Save Comment"
      >
        <Save className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function AdminBookingRequestsTable({
  bookingRequests,
}: {
  bookingRequests: AdminBookingRequest[];
}) {
  const [filterCreatedDate, setFilterCreatedDate] = useState("");
  const [filterCheckInDate, setFilterCheckInDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredRequests = bookingRequests.filter((req) => {
    if (filterStatus !== "All" && req.status !== filterStatus) return false;
    
    if (filterCreatedDate) {
      const reqCreated = req.created_at.split('T')[0];
      if (reqCreated !== filterCreatedDate) return false;
    }

    if (filterCheckInDate) {
      const reqCheckIn = req.check_in.split('T')[0];
      if (reqCheckIn !== filterCheckInDate) return false;
    }

    return true;
  });

  const getStatusBadge = (status: AdminBookingRequest["status"]) => {
    switch (status) {
      case "Request":
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">Request</span>;
      case "OnProcess":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">OnProcess</span>;
      case "Confirmed":
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Confirmed</span>;
      case "Checkout":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Checkout</span>;
      case "Cancel":
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Cancel</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  const getHostReplyIcon = (reply: AdminBookingRequest["host_reply"]) => {
    switch (reply) {
      case "done":
        return <span className="text-green-600 flex items-center gap-1" title="Done"><Check className="w-4 h-4" /> <span className="text-xs">Done</span></span>;
      case "reject":
        return <span className="text-red-600 flex items-center gap-1" title="Reject"><X className="w-4 h-4" /> <span className="text-xs">Reject</span></span>;
      case "contact_me":
        return <span className="text-blue-600 flex items-center gap-1" title="Contact Me"><Phone className="w-4 h-4" /> <span className="text-xs">Contact</span></span>;
      default:
        return <span className="text-gray-300">&mdash;</span>;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-charcoal/5 shadow-sm">
        <div className="flex flex-col">
          <label className="text-xs uppercase text-charcoal/60 font-semibold mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-charcoal/10 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gold"
          >
            <option value="All">All Statuses</option>
            <option value="Request">Request</option>
            <option value="OnProcess">OnProcess</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Checkout">Checkout</option>
            <option value="Cancel">Cancel</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs uppercase text-charcoal/60 font-semibold mb-1">Created Date</label>
          <input
            type="date"
            value={filterCreatedDate}
            onChange={(e) => setFilterCreatedDate(e.target.value)}
            className="border border-charcoal/10 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gold min-w-[140px]"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs uppercase text-charcoal/60 font-semibold mb-1">Check-in Date</label>
          <input
            type="date"
            value={filterCheckInDate}
            onChange={(e) => setFilterCheckInDate(e.target.value)}
            className="border border-charcoal/10 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gold min-w-[140px]"
          />
        </div>
        {(filterStatus !== "All" || filterCreatedDate || filterCheckInDate) && (
          <div className="flex flex-col justify-end mt-auto mb-1">
            <button
              onClick={() => {
                setFilterStatus("All");
                setFilterCreatedDate("");
                setFilterCheckInDate("");
              }}
              className="text-xs font-semibold text-red-500 hover:text-red-700 uppercase"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 lg:block">
      {/* Desktop view */}
      <div className="hidden lg:block overflow-x-auto bg-white rounded-2xl border border-charcoal/5 shadow-sm">
        <table className="w-full text-left text-sm text-charcoal">
          <thead className="bg-offwhite text-charcoal/60 uppercase text-xs tracking-wider border-b border-charcoal/5">
            <tr>
              <th className="px-4 py-3 font-semibold">Property</th>
              <th className="px-4 py-3 font-semibold">Guest</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Dates</th>
              <th className="px-4 py-3 font-semibold">Guests</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Host Reply</th>
              <th className="px-4 py-3 font-semibold w-64">Admin Comment</th>
              <th className="px-4 py-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal/5">
            {filteredRequests.map((req) => (
              <tr key={req.id} className="hover:bg-offwhite/50 transition-colors">
                <td className="px-4 py-3 font-medium display-font">{req.properties?.title || "Unknown"}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{req.guest_name}</div>
                  {req.message && <div className="text-xs text-charcoal/50 italic mt-1">&ldquo;{req.message}&rdquo;</div>}
                </td>
                <td className="px-4 py-3">
                  <a href={`tel:${req.guest_phone}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                    <Phone className="w-3.5 h-3.5" />
                    {req.guest_phone}
                  </a>
                </td>
                <td className="px-4 py-3 text-charcoal/70 whitespace-nowrap">
                  {format(parseISO(req.check_in), "MMM d")} - {format(parseISO(req.check_out), "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3">{req.total_guests}</td>
                <td className="px-4 py-3">{getStatusBadge(req.status)}</td>
                <td className="px-4 py-3">{getHostReplyIcon(req.host_reply)}</td>
                <td className="px-4 py-3">
                  <AdminCommentCell req={req} />
                </td>
                <td className="px-4 py-3 text-xs text-charcoal/50 whitespace-nowrap">
                  {format(parseISO(req.created_at), "MMM d, HH:mm")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view */}
      <div className="lg:hidden space-y-4">
        {filteredRequests.map((req) => (
          <div key={req.id} className="bg-white rounded-2xl border border-charcoal/5 p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-charcoal display-font">{req.properties?.title || "Unknown"}</h3>
                <div className="text-sm font-medium">{req.guest_name}</div>
              </div>
              <div className="text-right">
                {getStatusBadge(req.status)}
                <div className="text-xs text-charcoal/50 mt-1">
                  {format(parseISO(req.created_at), "MMM d, HH:mm")}
                </div>
              </div>
            </div>

            {req.message && (
              <p className="text-sm text-charcoal/60 italic border-l-2 border-gold/30 pl-2">
                &ldquo;{req.message}&rdquo;
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 text-sm text-charcoal/80">
              <div>
                <span className="text-charcoal/40 text-xs block uppercase">Phone</span>
                <a href={`tel:${req.guest_phone}`} className="inline-flex items-center gap-1 text-blue-600">
                  <Phone className="w-3 h-3" />
                  {req.guest_phone}
                </a>
              </div>
              <div>
                <span className="text-charcoal/40 text-xs block uppercase">Guests</span>
                {req.total_guests}
              </div>
              <div className="col-span-2">
                <span className="text-charcoal/40 text-xs block uppercase">Dates</span>
                {format(parseISO(req.check_in), "MMM d")} - {format(parseISO(req.check_out), "MMM d, yyyy")}
              </div>
            </div>

            <div className="mt-2 pt-3 border-t border-charcoal/5">
              <span className="text-charcoal/40 text-xs block uppercase mb-1">Host Reply</span>
              {getHostReplyIcon(req.host_reply)}
            </div>

            <div className="mt-1 pt-3 border-t border-charcoal/5">
              <span className="text-charcoal/40 text-xs block uppercase mb-1">Admin Comment</span>
              <AdminCommentCell req={req} />
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
