import WorldGlobe from "./components/WorldGlobe";
import countries from "../public/data/countries.json";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center py-12">
      <h1 className="text-white text-3xl font-bold mb-8">🌍 Country Power Tracker</h1>
      <WorldGlobe countries={countries} />
    </main>
  );
}