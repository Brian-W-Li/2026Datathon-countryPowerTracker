"use client";

const NUMERIC_TO_ISO3: Record<number, string> = {
  4:"AFG",8:"ALB",12:"DZA",24:"AGO",32:"ARG",36:"AUS",40:"AUT",50:"BGD",
  56:"BEL",64:"BTN",68:"BOL",76:"BRA",100:"BGR",116:"KHM",120:"CMR",124:"CAN",
  152:"CHL",156:"CHN",170:"COL",180:"COD",188:"CRI",191:"HRV",192:"CUB",
  208:"DNK",218:"ECU",818:"EGY",231:"ETH",246:"FIN",250:"FRA",276:"DEU",
  288:"GHA",300:"GRC",320:"GTM",332:"HTI",340:"HND",348:"HUN",356:"IND",
  360:"IDN",364:"IRN",368:"IRQ",372:"IRL",376:"ISR",380:"ITA",388:"JAM",
  392:"JPN",400:"JOR",398:"KAZ",404:"KEN",410:"KOR",408:"PRK",414:"KWT",
  418:"LAO",422:"LBN",434:"LBY",484:"MEX",496:"MNG",504:"MAR",508:"MOZ",
  516:"NAM",524:"NPL",528:"NLD",554:"NZL",558:"NIC",566:"NGA",578:"NOR",
  586:"PAK",591:"PAN",598:"PNG",600:"PRY",604:"PER",608:"PHL",616:"POL",
  620:"PRT",630:"PRI",634:"QAT",642:"ROU",643:"RUS",682:"SAU",686:"SEN",
  694:"SLE",706:"SOM",710:"ZAF",724:"ESP",144:"LKA",729:"SDN",752:"SWE",
  756:"CHE",760:"SYR",764:"THA",768:"TGO",780:"TTO",788:"TUN",792:"TUR",
  800:"UGA",804:"UKR",784:"ARE",826:"GBR",840:"USA",858:"URY",860:"UZB",
  862:"VEN",704:"VNM",887:"YEM",894:"ZMB",716:"ZWE"
};

import { useEffect, useRef, useState } from "react";
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

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    const projection = d3.geoOrthographic()
      .scale(280)
      .translate([width / 2, height / 2])
      .clipAngle(90);

    const path = d3.geoPath().projection(projection);

    // Color scale: green (high score) → red (low score)
    const colorScale = d3.scaleSequential()
      .domain([0, 100])
      .interpolator(d3.interpolateRdYlGn);

    const scoreMap = new Map(countries.map(c => [c.iso3, c]));

    // Draw ocean
    svg.append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", 280)
      .attr("fill", "#1a1a2e");

    // Load world topology
    d3.json("/world-110m.json").then((world: any) => {
      const geojson = feature(world, world.objects.countries) as any;

      // Draw countries
      svg.selectAll(".country")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path as any)
        .attr("fill", (d: any) => {
            const iso3 = NUMERIC_TO_ISO3[+d.id];
            const country = scoreMap.get(iso3);
            if (!country || country.green_score === null) return "#444444";
            return colorScale(country.green_score);
        })
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 0.3)
        .style("cursor", "pointer")
        .on("mouseover", function (event: MouseEvent, d: any) {
            d3.select(this).attr("stroke-width", 1.5).attr("stroke", "#fff");
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
            setTooltip(prev => prev ? { ...prev, x: event.offsetX, y: event.offsetY } : null);
        })
        .on("mouseout", function () {
            d3.select(this).attr("stroke-width", 0.3).attr("stroke", "#ffffff");
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
        .attr("d", path as any)
        .attr("fill", "none")
        .attr("stroke", "#ffffff10")
        .attr("stroke-width", 0.5);

      // Auto-rotation
      let rotation = 0;
      const timer = d3.timer(() => {
        rotation += 0.2;
        projection.rotate([rotation, -20]);
        svg.selectAll(".country").attr("d", path as any);
        svg.selectAll(".graticule").attr("d", path as any);
      });

      // Stop rotation on drag
      const drag = d3.drag<SVGSVGElement, unknown>()
        .on("start", () => timer.stop())
        .on("drag", (event) => {
          const [rx, ry] = projection.rotate();
          projection.rotate([rx + event.dx * 0.5, ry - event.dy * 0.5]);
          svg.selectAll(".country").attr("d", path as any);
        });

      svg.call(drag);

      // Zoom
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 4])
        .on("zoom", (event) => {
          projection.scale(280 * event.transform.k);
          svg.selectAll(".country").attr("d", path as any);
          svg.select("circle").attr("r", 280 * event.transform.k);
        });

      svg.call(zoom);
    });
  }, [countries, router]);

  return (
    <div className="relative flex items-center justify-center">
      <svg ref={svgRef} className="rounded-full" />
      {tooltip && (
        <div
          className="absolute bg-black text-white text-sm px-3 py-1 rounded pointer-events-none"
          style={{ left: tooltip.x + 10, top: tooltip.y - 30 }}
        >
          {tooltip.name} — {tooltip.score}
        </div>
      )}
    </div>
  );
}