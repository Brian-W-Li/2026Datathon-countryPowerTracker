import WorldGlobe from "./components/WorldGlobe";
import Recommendations from "./components/Recommendations";
import EpiRankings from "./components/EpiRankings";
import GlobalStats from "./components/GlobalStats";
import ColorLegend from "./components/ColorLegend";
import countries from "../public/data/countries.json";
import recommendations from "../public/data/recommendations.json";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center py-12 px-4">
      <h1 className="text-white text-3xl font-bold mb-8">Country Power Tracker</h1>
      <GlobalStats countries={countries} />
      <div className="flex flex-col lg:flex-row items-start justify-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <WorldGlobe countries={countries} />
          <ColorLegend />
        </div>
        <EpiRankings countries={countries} />
      </div>
      <Recommendations data={recommendations} />
      <footer className="mt-12 text-center text-xs text-gray-500 max-w-2xl mx-auto space-y-1 pb-4">
        <p>
          EPI scores from the <span className="text-gray-400">Yale Center for Environmental Law &amp; Policy — Environmental Performance Index (EPI) 2024</span>.
        </p>
        <p>
          CO2 emissions data from <span className="text-gray-400">Our World in Data / Global Carbon Budget 2024</span>.
        </p>
        <p>
          Clean energy capacity from <span className="text-gray-400">IRENA Renewable Capacity Statistics 2024</span>.
        </p>
      </footer>
    </main>
  );
}
