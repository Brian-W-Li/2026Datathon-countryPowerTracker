"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import { useRouter } from "next/navigation";

type Country = {
  iso3: string;
  name: string;
  green_score: number;
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
          // TopoJSON numeric IDs don't map directly to ISO3 — color by index for now
          // Backend should add numeric_id to countries.json to match TopoJSON ids
          return "#2d5a27";
        })
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 0.3)
        .style("cursor", "pointer")
        .on("mouseover", function (event: MouseEvent, d: any) {
          d3.select(this).attr("stroke-width", 1.5).attr("stroke", "#fff");
        })
        .on("mouseout", function () {
          d3.select(this).attr("stroke-width", 0.3).attr("stroke", "#ffffff");
          setTooltip(null);
        })
        .on("click", (event: MouseEvent, d: any) => {
          // Will route to country card once iso3 mapping is added
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
  }, [countries]);

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