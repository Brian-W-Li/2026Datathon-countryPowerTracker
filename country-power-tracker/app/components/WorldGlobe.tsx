"use client";

const NUMERIC_TO_ISO3: Record<number, string> = {
  4:"AFG",8:"ALB",10:"ATA",12:"DZA",24:"AGO",28:"ATG",31:"AZE",32:"ARG",
  36:"AUS",40:"AUT",44:"BHS",50:"BGD",51:"ARM",52:"BRB",56:"BEL",64:"BTN",
  68:"BOL",70:"BIH",72:"BWA",76:"BRA",84:"BLZ",90:"SLB",96:"BRN",100:"BGR",
  104:"MMR",108:"BDI",112:"BLR",116:"KHM",120:"CMR",124:"CAN",140:"CAF",
  144:"LKA",148:"TCD",152:"CHL",156:"CHN",158:"TWN",170:"COL",178:"COG",
  180:"COD",188:"CRI",191:"HRV",192:"CUB",196:"CYP",203:"CZE",204:"BEN",
  208:"DNK",214:"DOM",218:"ECU",222:"SLV",226:"GNQ",231:"ETH",232:"ERI",
  233:"EST",238:"FLK",242:"FJI",246:"FIN",250:"FRA",260:"ATF",262:"DJI",
  266:"GAB",268:"GEO",270:"GMB",275:"PSE",276:"DEU",288:"GHA",300:"GRC",
  304:"GRL",320:"GTM",324:"GIN",328:"GUY",332:"HTI",340:"HND",348:"HUN",
  352:"ISL",356:"IND",360:"IDN",364:"IRN",368:"IRQ",372:"IRL",376:"ISR",
  380:"ITA",384:"CIV",388:"JAM",392:"JPN",398:"KAZ",400:"JOR",404:"KEN",
  408:"PRK",410:"KOR",414:"KWT",417:"KGZ",418:"LAO",422:"LBN",426:"LSO",
  428:"LVA",430:"LBR",434:"LBY",440:"LTU",442:"LUX",450:"MDG",454:"MWI",
  458:"MYS",466:"MLI",478:"MRT",484:"MEX",496:"MNG",498:"MDA",499:"MNE",
  504:"MAR",508:"MOZ",512:"OMN",516:"NAM",524:"NPL",528:"NLD",540:"NCL",
  548:"VUT",554:"NZL",558:"NIC",562:"NER",566:"NGA",578:"NOR",586:"PAK",
  591:"PAN",598:"PNG",600:"PRY",604:"PER",608:"PHL",616:"POL",620:"PRT",
  624:"GNB",626:"TLS",630:"PRI",634:"QAT",642:"ROU",643:"RUS",646:"RWA",
  682:"SAU",686:"SEN",688:"SRB",694:"SLE",703:"SVK",704:"VNM",705:"SVN",
  706:"SOM",710:"ZAF",716:"ZWE",724:"ESP",728:"SSD",729:"SDN",732:"ESH",
  740:"SUR",748:"SWZ",752:"SWE",756:"CHE",760:"SYR",762:"TJK",764:"THA",
  768:"TGO",780:"TTO",784:"ARE",788:"TUN",792:"TUR",795:"TKM",800:"UGA",
  804:"UKR",807:"MKD",818:"EGY",826:"GBR",834:"TZA",840:"USA",854:"BFA",
  858:"URY",860:"UZB",862:"VEN",887:"YEM",894:"ZMB",
};

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as d3 from "d3";
import { feature } from "topojson-client";
import { useRouter } from "next/navigation";

type Country = {
  iso3: string;
  name: string;
  green_score: number | null;
  region: string;
  data_year: number;
};

type Props = {
  countries: Country[];
};

export default function WorldGlobe({ countries }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; score: number } | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 600;
    const height = 600;
    const BASE_SCALE = 280;
    const MIN_SCALE = 1;
    const MAX_SCALE = 3.5;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    const projection = d3.geoOrthographic()
      .scale(BASE_SCALE)
      .translate([width / 2, height / 2])
      .clipAngle(90);

    const path = d3.geoPath().projection(projection);

    // Color scale
    const colorScale = d3.scaleLinear<string>()
      .domain([0, 35, 50, 65, 100])
      .range(["#dc2626", "#ef4444", "#eab308", "#22c55e", "#16a34a"])
      .clamp(true);

    const scoreMap = new Map(countries.map((c) => [c.iso3, c]));

    // Defs
    const defs = svg.append("defs");
    const radGrad = defs.append("radialGradient").attr("id", "ocean-grad");
    radGrad.append("stop").attr("offset", "0%").attr("stop-color", "#1e3a5f");
    radGrad.append("stop").attr("offset", "100%").attr("stop-color", "#0f172a");

    const glow = defs.append("filter").attr("id", "globe-glow");
    glow.append("feGaussianBlur").attr("stdDeviation", "8").attr("result", "blur");
    glow.append("feComposite").attr("in", "SourceGraphic").attr("in2", "blur").attr("operator", "over");

    // Glow ring
    const glowRing = svg.append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", BASE_SCALE + 6)
      .attr("fill", "none")
      .attr("stroke", "#3b82f620")
      .attr("stroke-width", 12)
      .attr("filter", "url(#globe-glow)");

    // Ocean
    const ocean = svg.append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", BASE_SCALE)
      .attr("fill", "url(#ocean-grad)");

    // Load topology
    d3.json("/world-110m.json").then((world: any) => {
      const geojson = feature(world, world.objects.countries) as any;

      // Countries
      svg.selectAll(".country")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path as any)
        .attr("fill", (d: any) => {
            const iso3 = NUMERIC_TO_ISO3[+d.id];
            const country = scoreMap.get(iso3);
            if (!country || country.green_score === null) return "#334155";
            return colorScale(country.green_score);
        })
        .attr("stroke", "#94a3b830")
        .attr("stroke-width", 0.4)
        .style("cursor", "pointer")
        .on("mouseover", function (event: MouseEvent, d: any) {
            d3.select(this).attr("stroke-width", 1.5).attr("stroke", "#e2e8f0");
            const iso3 = NUMERIC_TO_ISO3[+d.id];
            const country = scoreMap.get(iso3);
            if (country) {
                setTooltip({
                x: event.offsetX,
                y: event.offsetY,
                name: country.name,
                score: country.green_score ?? 0,
                });
            }
        })
        .on("mousemove", function (event: MouseEvent) {
          setTooltip((prev) =>
            prev ? { ...prev, x: event.offsetX, y: event.offsetY } : null
          );
        })
        .on("mouseout", function () {
            d3.select(this).attr("stroke-width", 0.4).attr("stroke", "#94a3b830");
            setTooltip(null);
        })
        .on("click", (_event: MouseEvent, d: any) => {
            const iso3 = NUMERIC_TO_ISO3[+d.id];
            if (iso3) {
              router.push(`/country/${iso3}`);
            }
        });

      // Graticule
      const graticule = d3.geoGraticule();
      svg.append("path")
        .datum(graticule())
        .attr("class", "graticule")
        .attr("d", path as any)
        .attr("fill", "none")
        .attr("stroke", "#ffffff10")
        .attr("stroke-width", 0.5);

      // Auto-rotation
      let currentScale = 1;
      let rotation = 0;
      let tilt = -20;
      const timer = d3.timer(() => {
        rotation += 0.2;
        projection.rotate([rotation, tilt]);
        svg.selectAll(".country").attr("d", path as any);
        svg.selectAll(".graticule").attr("d", path as any);
      });

      // Drag
      const drag = d3.drag<SVGSVGElement, unknown>()
        .on("start", () => timer.stop())
        .on("drag", (event) => {
          const [rx, ry] = projection.rotate();
          const sensitivity = 0.5 / currentScale;
          const newTilt = Math.max(-60, Math.min(60, ry - event.dy * sensitivity));
          projection.rotate([rx + event.dx * sensitivity, newTilt]);
          svg.selectAll(".country").attr("d", path as any);
          svg.selectAll(".graticule").attr("d", path as any);
        });

      svg.call(drag);

      // Zoom with clamped bounds
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([MIN_SCALE, MAX_SCALE])
        .filter((event) => {
          // Allow wheel and touch events, block double-click zoom
          if (event.type === "dblclick") return false;
          return true;
        })
        .on("zoom", (event) => {
          currentScale = event.transform.k;
          const newR = BASE_SCALE * currentScale;
          projection.scale(newR);
          svg.selectAll(".country").attr("d", path as any);
          svg.selectAll(".graticule").attr("d", path as any);
          ocean.attr("r", newR);
          glowRing.attr("r", newR + 6);
        });

      svg.call(zoom);

      // Set initial transform so zoom knows the starting state
      svg.call(zoom.transform, d3.zoomIdentity);
    });
  }, [countries, router]);

  return (
    <div className="relative flex items-center justify-center">
      <svg ref={svgRef} className="rounded-full" />
      {tooltip && (
        <div
          className="absolute bg-gray-900/95 text-white text-sm px-3 py-2 rounded-lg pointer-events-none border border-gray-700/50 shadow-xl backdrop-blur-sm"
          style={{ left: tooltip.x + 12, top: tooltip.y - 35 }}
        >
          <span className="font-semibold">{tooltip.name}</span>
          <span className="text-gray-500 mx-1.5">&middot;</span>
          <span className="font-bold text-emerald-400">{tooltip.score}</span>
        </div>
      )}
      <div className="absolute bottom-4 right-4 text-gray-400 text-xs">
        Click a country for details
      </div>
    </div>
  );
}
