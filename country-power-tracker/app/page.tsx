import WorldGlobe from "./components/WorldGlobe";
import Recommendations from "./components/Recommendations";
import EpiRankings from "./components/EpiRankings";
import countries from "../public/data/countries.json";
import recommendations from "../public/data/recommendations.json";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center py-12">
      <h1 className="text-white text-3xl font-bold mb-8">Country Power Tracker</h1>
      <div className="flex flex-col lg:flex-row items-start justify-center gap-8">
        <WorldGlobe countries={countries} />
        <EpiRankings countries={countries} />
      </div>
      <Recommendations data={recommendations} />
    </main>
  );
}
