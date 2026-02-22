import Link from "next/link";
import WorldGlobe from "./components/WorldGlobe";
import Recommendations from "./components/Recommendations";
import EpiRankings from "./components/EpiRankings";
import GlobalStats from "./components/GlobalStats";
import ColorLegend from "./components/ColorLegend";
import countries from "../public/data/countries.json";
import recommendations from "../public/data/recommendations.json";
import overviewStats from "../public/data/overview_stats.json";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center py-12 px-4">
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-white text-3xl font-bold tracking-tight mb-2">
          Country Power Tracker
        </h1>
        <p className="text-gray-500 text-sm max-w-lg mx-auto mb-5">
          Explore environmental performance, clean energy capacity, and climate
          policy effectiveness for 180+ countries worldwide.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/policy-analysis"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-900/30"
          >
            Policy Impact Analysis &rarr;
          </Link>
          <Link
            href="/methodology"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg border border-gray-700 transition-all"
          >
            Methodology
          </Link>
        </div>
      </div>

      <GlobalStats countries={countries} />

      <div className="flex flex-col lg:flex-row items-start justify-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <WorldGlobe countries={countries} />
          <ColorLegend />
        </div>
        <EpiRankings countries={countries} />
      </div>

      <Recommendations data={recommendations} />

      <footer className="mt-12 text-center text-xs text-gray-600 max-w-2xl mx-auto space-y-0.5 pb-4">
        <p>
          EPI scores: Yale Center for Environmental Law & Policy — EPI 2024
        </p>
        <p>
          CO2 data: Our World in Data / Global Carbon Budget 2024
        </p>
        <p>
          Clean energy: IRENA Renewable Capacity Statistics 2024
        </p>
      </footer>
    </main>
  );
}
