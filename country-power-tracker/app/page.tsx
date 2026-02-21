import Recommendations from "./components/Recommendations";
import data from "../public/data/recommendations.json";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <Recommendations data={data} />
    </main>
  );
}