import analysis from "../../public/data/policy_analysis.json";
import co2GdpChange5y from "../../public/data/co2_gdp_change_5y.json";
import PolicyAnalysis, { type AnalysisData, type Co2GdpChange5y } from "./PolicyAnalysis";

export default function PolicyAnalysisPage() {
  const analysisData = analysis as unknown as AnalysisData;
  const co2Data = co2GdpChange5y as unknown as Co2GdpChange5y;
  return <PolicyAnalysis data={analysisData} co2GdpChange5y={co2Data} />;
}
