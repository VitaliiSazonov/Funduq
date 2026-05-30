"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Phone } from "lucide-react";
import { updateBookingRequestStatus, setHostReply } from "@/app/actions/booking-requests";
import { format, parseISO } from "date-fns";

export type BookingRequest = {
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
  created_at: string;
  properties: { title: string } | null;
};

export default function BookingRequestsTable({
  bookingRequests,
}: {
  bookingRequests: BookingRequest[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (id: string, newStatus: "Request" | "OnProcess" | "Confirmed" | "Checkout" | "Cancel") => {
    startTransition(async () => {
      const result = await updateBookingRequestStatus({ id, status: newStatus });
      if (!result.success) {
        console.error("Failed to update status:", result.error);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  };

  const handleReplyChange = (id: string, newReply: "done" | "reject" | "contact_me") => {
    startTransition(async () => {
      const result = await setHostReply({ id, host_reply: newReply });
      if (!result.success) {
        console.error("Failed to update host reply:", result.error);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 lg:block">
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
              <th className="px-4 py-3 font-semibold">Admin Comment</th>
              <th className="px-4 py-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal/5">
            {bookingRequests.map((req) => (
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
                <td className="px-4 py-3">
                  <select
                    disabled={isPending}
                    value={req.status}
                    onChange={(e) => handleStatusChange(req.id, e.target.value as BookingRequest["status"])}
                    className="border border-charcoal/10 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
                  >
                    <option value="Request">Request</option>
                    <option value="OnProcess">OnProcess</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Checkout">Checkout</option>
                    <option value="Cancel">Cancel</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-max">
                    <button
                      disabled={isPending}
                      onClick={() => handleReplyChange(req.id, "done")}
                      className={`p-1.5 rounded-md transition-all ${
                        req.host_reply === "done" ? "bg-white shadow-sm ring-1 ring-blue-500 text-green-600" : "text-gray-400 hover:text-gray-600"
                      } disabled:opacity-50`}
                      title="Done"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => handleReplyChange(req.id, "reject")}
                      className={`p-1.5 rounded-md transition-all ${
                        req.host_reply === "reject" ? "bg-white shadow-sm ring-1 ring-blue-500 text-red-600" : "text-gray-400 hover:text-gray-600"
                      } disabled:opacity-50`}
                      title="Reject"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => handleReplyChange(req.id, "contact_me")}
                      className={`p-1.5 rounded-md transition-all ${
                        req.host_reply === "contact_me" ? "bg-white shadow-sm ring-1 ring-blue-500 text-blue-600" : "text-gray-400 hover:text-gray-600"
                      } disabled:opacity-50`}
                      title="Contact Me"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {req.admin_comment ? (
                    <span className="text-gray-500 text-sm">{req.admin_comment}</span>
                  ) : (
                    <span className="text-gray-300">&mdash;</span>
                  )}
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
        {bookingRequests.map((req) => (
          <div key={req.id} className="bg-white rounded-2xl border border-charcoal/5 p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-charcoal display-font">{req.properties?.title || "Unknown"}</h3>
                <div className="text-sm font-medium">{req.guest_name}</div>
              </div>
              <div className="text-xs text-charcoal/50">
                {format(parseISO(req.created_at), "MMM d, HH:mm")}
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

            <div className="flex items-center gap-2 mt-2 pt-3 border-t border-charcoal/5">
              <div className="flex-1">
                <label className="text-xs text-charcoal/40 uppercase block mb-1">Status</label>
                <select
                  disabled={isPending}
                  value={req.status}
                  onChange={(e) => handleStatusChange(req.id, e.target.value as BookingRequest["status"])}
                  className="w-full border border-charcoal/10 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
                >
                  <option value="Request">Request</option>
                  <option value="OnProcess">OnProcess</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Checkout">Checkout</option>
                  <option value="Cancel">Cancel</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-charcoal/40 uppercase block mb-1">Reply</label>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-max">
                  <button
                    disabled={isPending}
                    onClick={() => handleReplyChange(req.id, "done")}
                    className={`p-1.5 rounded-md transition-all ${
                      req.host_reply === "done" ? "bg-white shadow-sm ring-1 ring-blue-500 text-green-600" : "text-gray-400 hover:text-gray-600"
                    } disabled:opacity-50`}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => handleReplyChange(req.id, "reject")}
                    className={`p-1.5 rounded-md transition-all ${
                      req.host_reply === "reject" ? "bg-white shadow-sm ring-1 ring-blue-500 text-red-600" : "text-gray-400 hover:text-gray-600"
                    } disabled:opacity-50`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => handleReplyChange(req.id, "contact_me")}
                    className={`p-1.5 rounded-md transition-all ${
                      req.host_reply === "contact_me" ? "bg-white shadow-sm ring-1 ring-blue-500 text-blue-600" : "text-gray-400 hover:text-gray-600"
                    } disabled:opacity-50`}
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {req.admin_comment && (
              <div className="mt-1 pt-2 border-t border-charcoal/5">
                <span className="text-xs text-charcoal/40 uppercase block mb-0.5">Admin Comment</span>
                <p className="text-sm text-gray-500">{req.admin_comment}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
