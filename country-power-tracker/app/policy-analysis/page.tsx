import analysis from "../../public/data/policy_analysis.json";
import co2PcChange5y from "../../public/data/co2_pc_change_5y.json";
import PolicyAnalysis, { type AnalysisData, type Co2PcChange5y } from "./PolicyAnalysis";

export default function PolicyAnalysisPage() {
  const analysisData = analysis as unknown as AnalysisData;
  const co2Data = co2PcChange5y as unknown as Co2PcChange5y;
  return <PolicyAnalysis data={analysisData} co2PcChange5y={co2Data} />;
}
