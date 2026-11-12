import React, { useState } from 'react';
import { X, Calculator, Clock, HelpCircle, CheckCircle2 } from 'lucide-react';

interface ParkingFeeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ParkingFeeCalculatorModal: React.FC<ParkingFeeCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [hours, setHours] = useState(2);
  const [minutes, setMinutes] = useState(30);
  const [isCentral, setIsCentral] = useState(false);
  const [vehicle, setVehicle] = useState<'car' | 'bike'>('car');
  const [isSunday, setIsSunday] = useState(false);
  const [isNight, setIsNight] = useState(false);

  const totalMinutes = hours * 60 + minutes;

  // Calculation
  let hdbFee = 0;
  let breakdown = '';
  let graceActive = false;

  if (totalMinutes <= 10) {
    graceActive = true;
    hdbFee = 0;
    breakdown = 'Within 10-minute grace period (S$0.00)';
  } else if (vehicle === 'bike') {
    // Motorbike standard rate in Singapore: $0.65 per session (7am-10:30pm or 10:30pm-7am)
    hdbFee = isNight ? 1.30 : 0.65;
    breakdown = `Motorbike standard session flat rate: S$${hdbFee.toFixed(2)}`;
  } else if (isSunday && !isCentral) {
    hdbFee = 0;
    breakdown = 'Sunday Free Parking Scheme (7:00am - 10:30pm)';
  } else {
    const ratePer30 = isCentral ? 1.20 : 0.60;
    const blocks = Math.ceil(totalMinutes / 30);
    let calculated = blocks * ratePer30;

    if (isNight) {
      calculated = Math.min(calculated, 5.0);
      breakdown = `${blocks} × 30-min blocks @ S$${ratePer30.toFixed(2)} (HDB S$5.00 Night Cap applied)`;
    } else {
      breakdown = `${blocks} × 30-min blocks @ S$${ratePer30.toFixed(2)}`;
    }
    hdbFee = calculated;
  }

  // Estimated mall rate comparison (typically $2.40 first hour + $1.40 sub hr)
  const mallEstimated = totalMinutes <= 10 ? 0 : Math.ceil(totalMinutes / 60) * (isCentral ? 3.0 : 1.8);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Singapore Parking Fee Calculator
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Vehicle & Area Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Vehicle Type
              </label>
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  onClick={() => setVehicle('car')}
                  className={`py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${
                    vehicle === 'car'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Car
                </button>
                <button
                  onClick={() => setVehicle('bike')}
                  className={`py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${
                    vehicle === 'bike'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Motorcycle
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Location Precinct
              </label>
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  onClick={() => setIsCentral(false)}
                  className={`py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${
                    !isCentral
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Non-Central
                </button>
                <button
                  onClick={() => setIsCentral(true)}
                  className={`py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${
                    isCentral
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Central Area
                </button>
              </div>
            </div>
          </div>

          {/* Duration Inputs */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Parking Duration: {hours} hours {minutes} minutes ({totalMinutes} mins total)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 text-[11px]">Hours:</span>
                <input
                  type="range"
                  min={0}
                  max={12}
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600"
                />
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">Minutes:</span>
                <input
                  type="range"
                  min={0}
                  max={45}
                  step={15}
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Conditional Options */}
          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isSunday}
                onChange={(e) => setIsSunday(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span>Sunday / Public Holiday</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={isNight}
                onChange={(e) => setIsNight(e.target.checked)}
                className="rounded text-emerald-600"
              />
              <span>Overnight (10:30pm - 7am)</span>
            </label>
          </div>

          {/* Result Cards */}
          <div className="space-y-2 pt-2">
            {/* HDB / URA Standard Fee */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  HDB / URA Standard EPS
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {breakdown}
                </div>
              </div>
              <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                S${hdbFee.toFixed(2)}
              </div>
            </div>

            {/* Shopping Mall Comparison */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Typical Commercial Mall Comparison
                </div>
                <div className="text-[11px] text-slate-400">
                  Approx. S${isCentral ? '3.00' : '1.80'} / hour average commercial rate
                </div>
              </div>
              <div className="text-base font-bold font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                ~S${mallEstimated.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Quick Note */}
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-lg text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
            💡 <strong>10-minute grace period:</strong> Applies to all HDB Electronic Parking System (EPS) gantries for pick-up and drop-offs. If your vehicle exits within 10 minutes of entry, no charge is deducted.
          </div>
        </div>
      </div>
    </div>
  );
};
