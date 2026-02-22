import Link from "next/link";

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="mb-6 flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm"
        >
          <span>&larr;</span> Back to Globe
        </Link>

        <h1 className="text-2xl font-bold mb-2">Methodology & Sources</h1>
        <p className="text-gray-500 text-sm mb-8">
          How we built the Country Power Tracker and what data drives the analysis.
        </p>

        {/* Data Sources */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 text-white">Data Sources</h2>
          <div className="space-y-4">
            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-5">
              <div className="text-[10px] text-emerald-400 font-semibold mb-1 uppercase tracking-widest">Environmental Performance</div>
              <div className="text-sm font-medium text-white mb-2">Yale Environmental Performance Index (EPI) 2024</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                The EPI ranks 180 countries on environmental health and ecosystem vitality using 58 performance
                indicators across 11 issue categories. Scores range from 0 to 100, where higher values indicate
                better environmental performance. Categories include air quality, water & sanitation, heavy metals,
                biodiversity, ecosystem services, fisheries, climate change, pollution emissions, agriculture, and
                water resources.
              </p>
            </div>

            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-5">
              <div className="text-[10px] text-blue-400 font-semibold mb-1 uppercase tracking-widest">Climate Policies</div>
              <div className="text-sm font-medium text-white mb-2">IEA / OECD Climate Policy Tracker</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                A comprehensive database of 12,470+ climate and energy policies across 217 jurisdictions maintained
                by the International Energy Agency. Each policy record includes the policy type (sector), instrument
                mechanism (e.g., tax, subsidy, standard), legal binding status, quantified targets, and current
                enforcement status. We classify policies into 7 sectors: Renewable Energy (RE), Cross-cutting/Framework
                (CF), Energy Efficiency (EEF), Fossil Phase-Down (FPD), Green Transport (GRT), Carbon Pricing &
                Markets (CPM), and Land Use (LU).
              </p>
            </div>

            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-5">
              <div className="text-[10px] text-orange-400 font-semibold mb-1 uppercase tracking-widest">CO2 Emissions</div>
              <div className="text-sm font-medium text-white mb-2">Our World in Data / Global Carbon Budget 2024</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                National CO2 emissions data sourced from the Global Carbon Project&apos;s annual budget. Metrics
                include total emissions, emissions per capita, and emissions per unit GDP (carbon intensity).
                Time-series data allows trend analysis from 1990 to the most recent available year.
              </p>
            </div>

            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-5">
              <div className="text-[10px] text-cyan-400 font-semibold mb-1 uppercase tracking-widest">Clean Energy</div>
              <div className="text-sm font-medium text-white mb-2">IRENA Renewable Capacity Statistics 2024</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Installed renewable energy generation capacity by country and technology type. Covers solar PV,
                onshore and offshore wind, hydropower, geothermal, biomass, and marine energy. Used to compute
                clean energy share as a percentage of total installed capacity.
              </p>
            </div>
          </div>
        </section>

        {/* Green Score */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 text-white">Green Score (EPI-based)</h2>
          <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-5">
            <p className="text-xs text-gray-400 leading-relaxed mb-3">
              The &quot;green score&quot; displayed on the globe and in country rankings is the Yale EPI 2024 composite
              score. It integrates 58 indicators into a single 0&ndash;100 value per country. The color scale on the
              globe maps scores as follows:
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-600 inline-block" /> 0&ndash;35 (Low)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-yellow-500 inline-block" /> 35&ndash;65 (Medium)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-600 inline-block" /> 65&ndash;100 (High)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-700 inline-block" /> No data</span>
            </div>
          </div>
        </section>

	        {/* Analytical Methods */}
	        <section className="mb-10">
	          <h2 className="text-lg font-semibold mb-4 text-white">Analytical Methods</h2>
	          <div className="space-y-4">
	            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-5">
	              <h3 className="text-sm font-semibold text-white mb-2">Policy Attribute Extraction</h3>
	              <p className="text-xs text-gray-400 leading-relaxed">
	                We transform the raw IEA/OECD Climate Policy Tracker export into a standardized policy table used
	                by the frontend. Each policy is assigned a sector code using rule-based mapping from the IEA topic
	                fields with a keyword fallback when topic metadata is missing. We then classify key policy
	                attributes&mdash;instrument type, legal binding status, and whether the policy includes quantified
	                targets&mdash;using an LLM-assisted workflow (GPT-4o-mini) and cache the results for reuse. Policy
	                status (e.g., &quot;In force&quot; vs &quot;Ended&quot; or &quot;Announced&quot;) is retained so we can compute
	                &quot;currently in effect&quot; counts and portfolio shares consistently across countries.
	              </p>
	            </div>

	            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-5">
	              <h3 className="text-sm font-semibold text-white mb-2">Correlation Analysis</h3>
	              <p className="text-xs text-gray-400 leading-relaxed">
	                Pearson correlation coefficient (r) measures linear association between each policy sector&apos;s
                share of a country&apos;s portfolio and its CO2 emissions (per capita or per GDP). Statistical
                significance tested via two-tailed t-test. A negative r indicates that countries with a larger share
                of that policy type tend to have lower CO2.
              </p>
            </div>

            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-5">
              <h3 className="text-sm font-semibold text-white mb-2">Lift Score</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-2">
                Lift measures how over-represented a policy characteristic is among top-performing countries.
              </p>
              <code className="block text-emerald-400 bg-gray-800 px-3 py-2 rounded text-[11px] mb-2">
                Lift = P(top quartile | above-median sector share) / P(top quartile)
              </code>
              <p className="text-xs text-gray-400 leading-relaxed">
                &quot;Top quartile&quot; = countries in the lowest 25% of CO2 per GDP among those with 5+
                policies. A lift of 1.2x means a country emphasizing that sector is 20% more likely to be a top
                performer than the base rate.
              </p>
            </div>

            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-5">
              <h3 className="text-sm font-semibold text-white mb-2">Sector Density Normalization</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                To avoid bias toward large economies that naturally have more policies, we normalize by computing
                each sector&apos;s share as (sector count / total policies) per country. This density measure
                ensures we capture policy emphasis rather than raw count.
              </p>
            </div>

            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-5">
              <h3 className="text-sm font-semibold text-white mb-2">Policy Cocktails</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Countries are grouped by their two most-represented policy sectors (by count). Average CO2/GDP
                is compared across groups containing 3+ countries to identify which sector combinations are
                associated with the lowest carbon intensity.
              </p>
            </div>

            <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-5">
              <h3 className="text-sm font-semibold text-white mb-2">Instrument Effectiveness</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                For each policy instrument type (subsidies, carbon taxes, standards, bans, etc.), we split countries
                into &quot;users&quot; vs &quot;non-users&quot; and compare average CO2 per capita. Point-biserial
                correlation tests whether the presence of an instrument is associated with lower emissions.
              </p>
            </div>
          </div>
        </section>

        {/* Limitations */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 text-white">Limitations</h2>
          <div className="bg-gray-900/80 rounded-xl border border-gray-800/60 p-5 space-y-3 text-xs text-gray-400 leading-relaxed">
            <p>
              <strong className="text-gray-300">Correlation does not imply causation.</strong> Cross-sectional
              analysis cannot establish that policies directly caused lower emissions. Wealthier nations may
              simultaneously adopt more policies and have lower carbon intensity due to economic structure.
            </p>
            <p>
              <strong className="text-gray-300">Policy quality vs quantity.</strong> We count policies but do
              not measure implementation quality, enforcement rigor, or budget allocation. A single well-funded
              policy may outperform dozens of poorly enforced ones.
            </p>
            <p>
              <strong className="text-gray-300">Time lag effects.</strong> Recently enacted policies may not yet
              show measurable effects on emissions. This analysis compares current policy portfolios with
              current emissions rather than modeling dynamic trajectories.
            </p>
            <p>
              <strong className="text-gray-300">Selection bias.</strong> Countries with better data reporting
              may appear to have more policies because they are better documented in the IEA/OECD tracker.
            </p>
            <p>
              <strong className="text-gray-300">Country coverage.</strong> The EPI scores 180 countries; the
              policy tracker covers 217 jurisdictions. The globe visualization uses a 110m resolution topology
              with ~177 polygons. Some small island states and territories may not appear on the map.
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="text-xs text-gray-600 space-y-0.5 pb-8">
          <p>Built for the 2026 Datathon &middot; Country Power Tracker</p>
        </div>
      </div>
    </main>
  );
}
