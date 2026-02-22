import analysis from "../../public/data/policy_analysis.json";
import PolicyAnalysis from "./PolicyAnalysis";

export default function PolicyAnalysisPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <PolicyAnalysis data={analysis as any} />;
}
