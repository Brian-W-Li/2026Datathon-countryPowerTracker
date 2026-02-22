import CountryDeepDive from "./CountryDeepDive";
import countriesData from "../../../public/data/countries.json";
import deepDiveData from "../../../public/data/country_deep_dive.json";
import cleanEnergyData from "../../../public/data/clean_energy.json";
import policyData from "../../../public/data/country_policies.json";
import policyListData from "../../../public/data/country_policy_list.json";
import policyAnalysis from "../../../public/data/policy_analysis.json";

type DeepDiveEntry = {
  iso3: string;
  series: { year: number; co2_per_capita: number; co2_per_gdp: number }[];
};

type CleanEnergyEntry = {
  iso3: string;
  series: {
    year: number;
    clean_capacity_mw: number;
    total_capacity_mw: number;
    clean_share: number;
  }[];
};

type TopicSummary = {
  topic: string;
  total: number;
  active: number;
};

type PolicySummaryEntry = {
  iso3: string;
  topic_summary: TopicSummary[];
  total_policies: number;
  active_policies: number;
};

type PolicyRecord = {
  title: string;
  topic: string;
  family: string | null;
  year: number | null;
  status: string;
};

type PolicyListEntry = {
  iso3: string;
  active_policies: PolicyRecord[];
};

type CountryEntry = {
  iso3: string;
  name: string;
  green_score: number | null;
  region: string;
  data_year: number;
};

type ScatterEntry = {
  iso3: string;
  co2_per_gdp: number;
  total_policies: number;
  sectors: Record<string, number>;
};

type Props = {
  params: Promise<{ iso3: string }>;
};

type SectorLift = {
  bucket_id: string;
  bucket_name: string;
  lift: number;
  top_in_sector: number;
  total_in_sector: number;
};

export default async function CountryPage({ params }: Props) {
  const { iso3 } = await params;
  const upper = iso3.toUpperCase();

  const country = (countriesData as CountryEntry[]).find(
    (c) => c.iso3 === upper
  );
  const deepDive = (deepDiveData as DeepDiveEntry[]).find(
    (d) => d.iso3 === upper
  );
  const cleanEnergy = (cleanEnergyData as CleanEnergyEntry[]).find(
    (d) => d.iso3 === upper
  );
  const policySummary = (policyData as PolicySummaryEntry[]).find(
    (d) => d.iso3 === upper
  );
  const policyList = (policyListData as PolicyListEntry[]).find(
    (d) => d.iso3 === upper
  );

  // Compute top-quartile status (lowest 25% CO2/GDP among countries with 5+ policies)
  const scatter = ((policyAnalysis as { scatter_data: ScatterEntry[] }).scatter_data ?? [])
    .filter((c) => (c.total_policies ?? 0) >= 5 && c.co2_per_gdp != null);
  const sorted = [...scatter].sort((a, b) => a.co2_per_gdp - b.co2_per_gdp);
  const cutoff = Math.ceil(sorted.length * 0.25);
  const topQuartileSet = new Set(sorted.slice(0, cutoff).map((c) => c.iso3));
  const isTopTier = topQuartileSet.has(upper);

  const analysis = policyAnalysis as unknown as {
    scatter_data: ScatterEntry[];
    sector_names: Record<string, string>;
    lift_scores: { sector_lifts: SectorLift[] };
  };

  const name = country?.name ?? upper;
  const region = country?.region ?? "Unknown";
  const co2Series = deepDive?.series ?? [];
  const energySeries = cleanEnergy?.series ?? [];
  const topicSummary = policySummary?.topic_summary ?? [];
  const totalPolicies = policySummary?.total_policies ?? 0;
  const activePolicies = policySummary?.active_policies ?? 0;
  const activePolicyList = policyList?.active_policies ?? [];

  return (
    <CountryDeepDive
      iso3={upper}
      name={name}
      region={region}
      co2Series={co2Series}
      energySeries={energySeries}
      topicSummary={topicSummary}
      totalPolicies={totalPolicies}
      activePolicies={activePolicies}
      activePolicyList={activePolicyList}
      isTopTier={isTopTier}
      scatterData={analysis.scatter_data ?? []}
      sectorNames={analysis.sector_names ?? {}}
      sectorLifts={analysis.lift_scores?.sector_lifts ?? []}
    />
  );
}
