import WorldGlobe from "./components/WorldGlobe";
import Recommendations from "./components/Recommendations";
import Overview from "./components/Overview";
import countries from "../public/data/countries.json";
import recommendations from "../public/data/recommendations.json";
import overviewStats from "../public/data/overview_stats.json";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center py-12 px-4">
      <h1 className="text-white text-3xl font-bold mb-2">
        🌍 Global Environmental Policy Impact (GEPI)
      </h1>
      <p className="text-gray-400 text-sm mb-8">
        Tracking climate policy effectiveness across 180+ countries
      </p>
      <WorldGlobe countries={countries} />
      <Overview data={overviewStats as any} countries={countries} />
      <Recommendations data={recommendations} />
    </main>
  );
}
