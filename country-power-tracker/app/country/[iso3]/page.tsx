import CountryDeepDive from "./CountryDeepDive";
import countriesData from "../../../public/data/countries.json";
import deepDiveData from "../../../public/data/country_deep_dive.json";
import cleanEnergyData from "../../../public/data/clean_energy.json";
import policyData from "../../../public/data/country_policies.json";

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

type PolicyEntry = {
  iso3: string;
  topic_summary: TopicSummary[];
  total_policies: number;
  active_policies: number;
};

type CountryEntry = {
  iso3: string;
  name: string;
  green_score: number | null;
  region: string;
  data_year: number;
};

type Props = {
  params: Promise<{ iso3: string }>;
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
  const policies = (policyData as PolicyEntry[]).find(
    (d) => d.iso3 === upper
  );

  const name = country?.name ?? upper;
  const region = country?.region ?? "Unknown";
  const co2Series = deepDive?.series ?? [];
  const energySeries = cleanEnergy?.series ?? [];
  const topicSummary = policies?.topic_summary ?? [];
  const totalPolicies = policies?.total_policies ?? 0;
  const activePolicies = policies?.active_policies ?? 0;

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
    />
  );
}
