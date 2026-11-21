import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { Row } from '../lib/dataset'

type Props = {
  rows: Row[]
  metric: string
  format: (v: number) => string
}

const W = 900
const H = 440
const M = { top: 20, right: 200, bottom: 40, left: 100 }

export default function LineChart({ rows, metric, format }: Props) {
  const ref = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()

    const data = rows.filter((r) => r[metric] != null)
    if (!data.length) return

    const iw = W - M.left - M.right
    const ih = H - M.top - M.bottom

    const byRegion = d3.group(data, (r) => r.region_code)
    const years = d3.extent(data, (r) => r.year) as [number, number]
    const vals = d3.extent(data, (r) => r[metric] as number) as [number, number]

    const x = d3.scaleLinear().domain(years).range([0, iw])
    const y = d3.scaleLinear().domain(vals).nice().range([ih, 0])

    const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`)

    g.append('g')
      .selectAll('line')
      .data(y.ticks(6))
      .join('line')
      .attr('x1', 0)
      .attr('x2', iw)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '3 3')

    g.append('g')
      .attr('transform', `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(years[1] - years[0]).tickFormat(d3.format('d')))
      .call((s) => s.select('.domain').remove())
      .call((s) => s.selectAll('text').attr('fill', '#64748b').attr('font-size', 12))

    g.append('g')
      .call(d3.axisLeft(y).ticks(6).tickFormat((d) => format(d as number)))
      .call((s) => s.select('.domain').remove())
      .call((s) => s.selectAll('text').attr('fill', '#64748b').attr('font-size', 11))

    const color = d3.scaleOrdinal<string, string>(d3.schemeTableau10)

    const line = d3
      .line<Row>()
      .x((r) => x(r.year))
      .y((r) => y(r[metric] as number))
      .curve(d3.curveMonotoneX)

    const series = [...byRegion.entries()].sort((a, b) => a[0].localeCompare(b[0]))

    for (const [code, pts] of series) {
      const sorted = [...pts].sort((a, b) => a.year - b.year)
      const isCz = code === 'CZ'
      g.append('path')
        .datum(sorted)
        .attr('fill', 'none')
        .attr('stroke', isCz ? '#0f172a' : color(code))
        .attr('stroke-width', isCz ? 3.5 : 1.6)
        .attr('opacity', isCz ? 1 : 0.7)
        .attr('d', line)
    }

    const legend = svg
      .append('g')
      .attr('transform', `translate(${W - M.right + 20},${M.top})`)

    series.forEach(([code, pts], i) => {
      const item = legend.append('g').attr('transform', `translate(0,${i * 20})`)
      item
        .append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('rx', 2)
        .attr('fill', code === 'CZ' ? '#0f172a' : color(code))
      item
        .append('text')
        .attr('x', 16)
        .attr('y', 9)
        .attr('font-size', 11)
        .attr('fill', '#334155')
        .text(pts[0].region)
    })
  }, [rows, metric, format])

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Development over time"
    />
  )
}
