import CountryDeepDive from "./CountryDeepDive";
import countriesData from "../../../public/data/countries.json";
import deepDiveData from "../../../public/data/country_deep_dive.json";

type DeepDiveEntry = {
  iso3: string;
  series: { year: number; co2_per_capita: number; co2_per_gdp: number }[];
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

  const name = country?.name ?? upper;
  const greenScore = country?.green_score ?? null;
  const region = country?.region ?? "Unknown";
  const series = deepDive?.series ?? [];

  return (
    <CountryDeepDive
      iso3={upper}
      name={name}
      greenScore={greenScore}
      region={region}
      series={series}
    />
  );
}
