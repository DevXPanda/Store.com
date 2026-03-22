"use client";

import { MapPin, Bell, Leaf } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  subtitle: string;
  /** e.g. menu + page title — sits after the logo on the cream bar */
  leftExtra?: ReactNode;
  /** theme, refresh, profile — right side of the cream bar */
  rightExtra?: ReactNode;
};

export function VegFruBrandBar({ subtitle, leftExtra, rightExtra }: Props) {
  return (
    <div className="flex-shrink-0 z-[60]">
      <div className="bg-forest-800 text-green-100 text-xs py-1.5 text-center font-body tracking-wide">
        <span className="flex items-center justify-center gap-2 flex-wrap px-2">
          <MapPin className="w-3 h-3 shrink-0" />
          Free delivery above ₹299 · 4–6 hour delivery · Serving Delhi NCR
          <Bell className="w-3 h-3 ml-2 shrink-0" />
        </span>
      </div>
      <div className="bg-[#FEFAE0] border-b border-green-100">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 bg-forest-700 rounded-xl flex items-center justify-center shadow-md">
                <Leaf className="w-5 h-5 text-green-200" />
              </div>
              <div>
                <span className="font-display font-bold text-xl text-forest-800 tracking-tight">
                  Veg<span className="text-green-600">Fru</span>
                </span>
                <span className="block text-[9px] font-mono text-green-600 tracking-widest uppercase -mt-0.5">
                  {subtitle}
                </span>
              </div>
            </div>
            {leftExtra}
          </div>
          {rightExtra && (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
              {rightExtra}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
