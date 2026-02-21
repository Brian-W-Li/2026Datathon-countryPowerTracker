import WorldGlobe from "./components/WorldGlobe";
import Recommendations from "./components/Recommendations";
import countries from "../public/data/countries.json";
import recommendations from "../public/data/recommendations.json";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center py-12">
      <h1 className="text-white text-3xl font-bold mb-8">🌍 Country Power Tracker</h1>
      <WorldGlobe countries={countries} />
      <Recommendations data={recommendations} />
    </main>
  );
}