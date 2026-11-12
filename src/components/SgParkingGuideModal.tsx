import React from 'react';
import { X, HelpCircle, Shield, AlertTriangle, CheckCircle2, PhoneCall, ExternalLink } from 'lucide-react';

interface SgParkingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SgParkingGuideModal: React.FC<SgParkingGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Singapore Driver's Parking Guide & Lot Color Rules
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-slate-600 dark:text-slate-300">
          {/* Section 1: Lot Markings & Colors */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              1. Singapore Carpark Lot Markings & Demarcations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3.5 h-3.5 border-2 border-slate-400 bg-white rounded-xs inline-block"></span>
                  <span className="font-bold text-slate-900 dark:text-white">White Parking Lots</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Available for all motorists (both season ticket holders and short-term visitors). Standard HDB rates apply: S$0.60/30m or S$1.20/30m in Central Area.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3.5 h-3.5 bg-amber-400 rounded-xs inline-block"></span>
                  <span className="font-bold text-slate-900 dark:text-white">Yellow Parking Lots</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Higher demand areas (typically Central Business District & Orchard). Visitors and season holders may park. Rate is typically S$1.20 per half hour.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3.5 h-3.5 bg-rose-600 rounded-xs inline-block"></span>
                  <span className="font-bold text-rose-900 dark:text-rose-200">Red Parking Lots</span>
                </div>
                <p className="text-[11px] text-rose-800/80 dark:text-rose-300">
                  <strong>Strictly for Season Parking Ticket (SPT) holders only 24/7.</strong> Non-season parking in red lots is illegal and subject to heavy wheel-clamping and fines.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3.5 h-3.5 bg-gradient-to-r from-rose-500 to-white border border-slate-300 rounded-xs inline-block"></span>
                  <span className="font-bold text-amber-900 dark:text-amber-200">Red & White Bicolor Lots</span>
                </div>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300">
                  Reserved for Season Ticket holders from <strong>7:00pm to 7:00am daily</strong> and all day on Sundays & Public Holidays. Visitors may only park during daytime (7:00am - 7:00pm Mon-Sat).
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Key Parking Schemes */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              2. Standard Schemes & Discounts
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>10-Minute Grace Period:</strong> All EPS (Electronic Parking System) carparks under HDB and URA offer a 10-minute grace period for drop-offs, pick-ups, or finding a space. No charge is levied if you exit within 10 minutes.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Sunday Free Parking (FPS):</strong> Many HDB and selected URA carparks display yellow signs stating <em>"Free Parking on Sun & Public Holidays from 7:00am to 10:30pm"</em>. White lots are free during these designated hours.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Night Parking Cap (S$5.00):</strong> For cars parking overnight at HDB car parks with the night parking scheme, the maximum charge between 10:30pm and 7:00am the next day is capped at S$5.00.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Motorcycle Session Parking:</strong> Flat rate of S$0.65 per session (Day session: 7:00am – 10:30pm; Night session: 10:30pm – 7:00am).
                </div>
              </li>
            </ul>
          </div>

          {/* Section 3: Payment Methods */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              3. Payment & Gantries
            </h3>
            <p className="leading-relaxed mb-2">
              Singapore electronic carparks operate via the <strong>In-Vehicle Unit (IU)</strong> connected to your vehicle. Accepted payment methods at gantries:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-semibold">
                NETS Motoring Card
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-semibold">
                NETS FlashPay
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-semibold">
                EZ-Link Motoring
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-semibold">
                NETS vCashCard
              </div>
            </div>
          </div>

          {/* Section 4: Hotlines */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>
              HDB Car Park Branch Toll-Free: <strong className="text-slate-800 dark:text-slate-200">1800-225-5432</strong>
            </div>
            <div>
              URA Car Park Division: <strong className="text-slate-800 dark:text-slate-200">6329 3434</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
