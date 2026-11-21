import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { Row } from '../lib/dataset'

type Props = {
  rows: Row[]
  metric: string
  format: (v: number) => string
  year: number
}

const W = 900
const M = { top: 10, right: 130, bottom: 30, left: 200 }
const BAR = 24
const GAP = 8

export default function BarChart({ rows, metric, format, year }: Props) {
  const ref = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()

    const data = rows
      .filter((r) => r.year === year && r.region_code !== 'CZ' && r[metric] != null)
      .sort((a, b) => (b[metric] as number) - (a[metric] as number))

    if (!data.length) return

    const H = M.top + M.bottom + data.length * (BAR + GAP)
    svg.attr('viewBox', `0 0 ${W} ${H}`)

    const iw = W - M.left - M.right
    const max = d3.max(data, (r) => r[metric] as number) as number

    const x = d3.scaleLinear().domain([0, max]).nice().range([0, iw])
    const color = d3.scaleSequential(d3.interpolateBlues).domain([0, max])

    const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`)

    g.append('g')
      .attr('transform', `translate(0,${H - M.top - M.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat((d) => format(d as number)))
      .call((s) => s.select('.domain').remove())
      .call((s) => s.selectAll('text').attr('fill', '#64748b').attr('font-size', 11))

    data.forEach((r, i) => {
      const top = i * (BAR + GAP)
      const val = r[metric] as number

      g.append('rect')
        .attr('x', 0)
        .attr('y', top)
        .attr('width', x(val))
        .attr('height', BAR)
        .attr('rx', 4)
        .attr('fill', color(val))

      g.append('text')
        .attr('x', -10)
        .attr('y', top + BAR / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('font-size', 12)
        .attr('fill', '#334155')
        .text(r.region)

      g.append('text')
        .attr('x', x(val) + 8)
        .attr('y', top + BAR / 2 + 4)
        .attr('font-size', 11)
        .attr('fill', '#475569')
        .text(format(val))
    })
  }, [rows, metric, format, year])

  return (
    <svg
      ref={ref}
      className="h-auto w-full"
      role="img"
      aria-label="Comparison by region"
    />
  )
}
