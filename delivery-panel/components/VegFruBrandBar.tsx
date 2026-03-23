"use client";

import { MapPin, Bell, Leaf } from "lucide-react";
import type { ReactNode } from "react";

export function VegFruBrandBar({ subtitle, rightExtra }: { subtitle: string; rightExtra?: ReactNode }) {
  return (
    <div className="flex-shrink-0 z-[60]">
      <div className="bg-forest-800 text-green-100 text-xs py-1.5 text-center font-body tracking-wide">
        <span className="flex items-center justify-center gap-2 flex-wrap px-2">
          <MapPin className="w-3 h-3 shrink-0" />
          Delivery operations · Live order tracking · Serving Delhi NCR
          <Bell className="w-3 h-3 ml-2 shrink-0" />
        </span>
      </div>
      <div className="bg-[#FEFAE0] border-b border-green-100 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
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
        {rightExtra && <div className="flex items-center gap-2 shrink-0">{rightExtra}</div>}
      </div>
    </div>
  );
}
