"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Download,
  PenLine,
  Loader2,
  ExternalLink,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { importFromAirbnb } from "@/app/actions/importAirbnb";
import type { AirbnbScrapedData } from "@/app/actions/importAirbnb";
import ListingWizard from "@/components/host/ListingWizard";

// ─────────────────────────────────────────────────────────────
// Progress stages for the import loader
// ─────────────────────────────────────────────────────────────
const IMPORT_STAGES = [
  { label: "Connecting to Airbnb...", duration: 800 },
  { label: "Fetching property details...", duration: 1200 },
  { label: "Downloading gallery images...", duration: 1500 },
  { label: "Uploading to secure storage...", duration: 1000 },
  { label: "Preparing your listing...", duration: 500 },
];

export default function NewPropertyPage() {
  const [mode, setMode] = useState<"choose" | "import-loading" | "wizard">(
    "choose"
  );
  const [airbnbUrl, setAirbnbUrl] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importedData, setImportedData] = useState<
    (AirbnbScrapedData & { uploadedImageUrls: string[] }) | undefined
  >();
  const [currentStage, setCurrentStage] = useState(0);

  // ─── Import Flow ───
  async function handleImport() {
    if (!airbnbUrl.trim()) return;
    setImportError(null);
    setMode("import-loading");
    setCurrentStage(0);

    // Animate through stages while the server action runs
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < IMPORT_STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 1200);

    const result = await importFromAirbnb(airbnbUrl);

    clearInterval(stageInterval);

    if (result.success && result.data) {
      // Brief pause to show the final stage
      setCurrentStage(IMPORT_STAGES.length - 1);
      await new Promise((r) => setTimeout(r, 600));
      setImportedData(result.data);
      setMode("wizard");
    } else {
      setImportError(result.error || "Import failed. Please try again.");
      setMode("choose");
    }
  }

  // ─── Manual Flow ───
  function handleManual() {
    setImportedData(undefined);
    setMode("wizard");
  }

  return (
    <div className="min-h-screen bg-offwhite">
      {/* ─── Header ─── */}
      <header className="border-b border-charcoal/5 bg-white/70 glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/host/dashboard"
              className="p-2 rounded-lg hover:bg-charcoal/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-charcoal" />
            </Link>
            <div>
              <h1 className="text-lg font-black display-font text-charcoal">
                New Listing
              </h1>
              <p className="text-xs text-charcoal/40 font-medium">
                Create or import a property
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="text-sm font-bold text-gold hover:text-gold-dark transition-colors"
          >
            Funduq
          </Link>
        </div>
      </header>

      {/* ─── Content ─── */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <AnimatePresence mode="wait">
          {/* ═══════════════════ CHOOSE MODE ═══════════════════ */}
          {mode === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Hero */}
              <div className="text-center mb-14">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <span className="inline-block text-xs font-black uppercase tracking-[0.25em] text-gold mb-4">
                    List Your Property
                  </span>
                  <h2 className="text-4xl md:text-5xl font-black display-font text-charcoal mb-4 tracking-tight">
                    How would you like to start?
                  </h2>
                  <p className="text-charcoal/45 max-w-xl mx-auto text-lg">
                    Import an existing Airbnb listing instantly, or build your
                    showcase from scratch.
                  </p>
                </motion.div>
              </div>

              {/* Two Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* ─── Card A: Import from Airbnb ─── */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25, duration: 0.5 }}
                  className="bg-white rounded-3xl border border-charcoal/5 p-8 md:p-10 shadow-luxury hover:shadow-xl transition-shadow duration-500 flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 gold-gradient rounded-2xl flex items-center justify-center">
                      <Download className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black display-font text-charcoal">
                        Import from Airbnb
                      </h3>
                      <p className="text-xs text-charcoal/40 font-medium">
                        Auto-fill your listing in seconds
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-charcoal/50 leading-relaxed mb-8">
                    Paste your Airbnb listing URL and we&apos;ll automatically
                    import the title, description, photos, pricing, and room
                    details. You can review and edit everything before publishing.
                  </p>

                  {/* URL Input */}
                  <div className="mt-auto space-y-4">
                    <div className="relative">
                      <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/25" />
                      <input
                        type="url"
                        value={airbnbUrl}
                        onChange={(e) => {
                          setAirbnbUrl(e.target.value);
                          setImportError(null);
                        }}
                        placeholder="https://airbnb.com/rooms/..."
                        className="w-full pl-11 pr-4 py-3.5 bg-offwhite border border-charcoal/10 rounded-xl text-charcoal placeholder:text-charcoal/25 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleImport();
                          }
                        }}
                      />
                    </div>

                    {importError && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-red-500 text-xs font-medium"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        {importError}
                      </motion.div>
                    )}

                    <button
                      type="button"
                      onClick={handleImport}
                      disabled={!airbnbUrl.trim()}
                      data-testid="import-submit"
                      className="w-full py-3.5 gold-gradient text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Import Listing
                    </button>
                  </div>
                </motion.div>

                {/* ─── Card B: Create Manually ─── */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35, duration: 0.5 }}
                  className="bg-white rounded-3xl border border-charcoal/5 p-8 md:p-10 shadow-luxury hover:shadow-xl transition-shadow duration-500 flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-charcoal rounded-2xl flex items-center justify-center">
                      <PenLine className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black display-font text-charcoal">
                        Create Manually
                      </h3>
                      <p className="text-xs text-charcoal/40 font-medium">
                        Craft your listing step by step
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-charcoal/50 leading-relaxed mb-8">
                    Use our guided wizard to create your luxury listing from
                    scratch. Add rich descriptions, upload high-resolution
                    photos, set amenities, and configure pricing — all with a
                    premium editorial experience.
                  </p>

                  <div className="mt-auto">
                    <button
                      type="button"
                      onClick={handleManual}
                      className="w-full py-3.5 bg-charcoal text-white rounded-xl font-bold text-sm hover:bg-charcoal/90 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <PenLine className="w-4 h-4" />
                      Start from Scratch
                    </button>
                  </div>

                  {/* Visual flair */}
                  <div className="mt-6 grid grid-cols-5 gap-2">
                    {["Basics", "Details", "Amenities", "Gallery", "Pricing"].map(
                      (step, i) => (
                        <div
                          key={step}
                          className="text-center"
                        >
                          <div className="w-full h-1 rounded-full bg-charcoal/5 mb-1.5" />
                          <span className="text-[9px] uppercase tracking-wider text-charcoal/25 font-semibold">
                            {step}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════ IMPORT LOADING ═══════════════════ */}
          {mode === "import-loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center py-32"
            >
              {/* Animated spinner */}
              <div className="relative mb-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "linear",
                  }}
                  className="w-20 h-20 rounded-full border-[3px] border-charcoal/5 border-t-gold"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-gold" />
                </div>
              </div>

              {/* Stage labels */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentStage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-lg font-semibold text-charcoal display-font mb-4"
                >
                  {IMPORT_STAGES[currentStage]?.label}
                </motion.p>
              </AnimatePresence>

              {/* Progress bar */}
              <div className="w-72 h-1.5 bg-charcoal/5 rounded-full overflow-hidden">
                <motion.div
                  animate={{
                    width: `${
                      ((currentStage + 1) / IMPORT_STAGES.length) * 100
                    }%`,
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full gold-gradient rounded-full"
                />
              </div>

              <p className="text-xs text-charcoal/30 mt-4 font-medium">
                This usually takes a few seconds
              </p>
            </motion.div>
          )}

          {/* ═══════════════════ WIZARD ═══════════════════ */}
          {mode === "wizard" && (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Header badge */}
              {importedData && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 flex items-center justify-center"
                >
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold-dark text-xs font-bold uppercase tracking-wider rounded-full border border-gold/20">
                    <Download className="w-3.5 h-3.5" />
                    Imported from Airbnb — Review & Edit
                  </span>
                </motion.div>
              )}

              <ListingWizard importedData={importedData} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
