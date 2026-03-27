"use client";

import { useState, useEffect, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { parseISO, addMonths, isSameDay } from "date-fns";
import { Loader2, CalendarDays } from "lucide-react";
import { getDisabledDates } from "@/app/actions/ical";

interface AvailabilityCalendarProps {
  propertyId: string;
}

export default function AvailabilityCalendar({
  propertyId,
}: AvailabilityCalendarProps) {
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDates = useCallback(async () => {
    setIsLoading(true);
    try {
      const dates = await getDisabledDates(propertyId);
      setDisabledDates(dates.map((d) => parseISO(d)));
    } catch {
      console.error("Failed to load availability");
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  function isDateDisabled(date: Date): boolean {
    return disabledDates.some((d) => isSameDay(d, date));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black display-font text-charcoal flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-gold" />
          Availability
        </h2>
        <span className="text-xs font-medium text-charcoal/40">
          Updated in real time
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-charcoal/5">
          <Loader2 className="w-6 h-6 text-gold animate-spin" />
          <span className="ml-2 text-sm text-charcoal/40">
            Loading calendar…
          </span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-charcoal/5 p-4 md:p-6 rdp-funduq">
          <DayPicker
            mode="single"
            disabled={[{ before: new Date() }, isDateDisabled]}
            numberOfMonths={2}
            startMonth={new Date()}
            endMonth={addMonths(new Date(), 12)}
            classNames={{
              root: "text-sm",
              months: "flex flex-col md:flex-row gap-6",
              day: "rounded-xl transition-colors",
              disabled: "text-charcoal/15 line-through",
              today: "font-black text-gold-dark",
            }}
          />
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-charcoal/5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-offwhite border border-charcoal/10" />
              <span className="text-xs text-charcoal/40 font-medium">
                Available
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-charcoal/10" />
              <span className="text-xs text-charcoal/40 font-medium line-through">
                Booked
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
