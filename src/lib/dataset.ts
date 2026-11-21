export type Row = {
  year: number
  region_code: string
  region: string
  area_km2: number
  population_total: number
  average_age: number
  male_female_ratio: number
  flat_price_czk_m2: number | null
  unemployment_rate_pct: number | null
  gdp_per_capita_czk: number | null
  wage_total: number | null
  [key: string]: number | string | null
}

const NUMERIC = new Set([
  'year',
  'area_km2',
  'population_total',
  'average_age',
  'male_female_ratio',
  'flat_price_czk_m2',
  'unemployment_rate_pct',
  'gdp_per_capita_czk',
  'wage_total',
])

export async function loadDataset(): Promise<Row[]> {
  const res = await fetch('./combined_dataset.csv')
  if (!res.ok) throw new Error(`Failed to load dataset (${res.status})`)

  const text = (await res.text()).replace(/^\uFEFF/, '').trim()
  const [head, ...lines] = text.split(/\r?\n/)
  const cols = head.split(';')

  return lines.map((line) => {
    const cells = line.split(';')
    const row: Record<string, number | string | null> = {}
    cols.forEach((col, i) => {
      const raw = cells[i] ?? ''
      if (NUMERIC.has(col) || col.startsWith('wage_')) {
        row[col] = raw === '' ? null : Number(raw)
      } else {
        row[col] = raw
      }
    })
    return row as Row
  })
}

export type Metric = {
  key: string
  label: string
  short: string
  format: (v: number) => string
}

const czk = (v: number) => `${Math.round(v).toLocaleString('en-US')} CZK`

export const METRICS: Metric[] = [
  { key: 'gdp_per_capita_czk', label: 'GDP per capita', short: 'GDP', format: czk },
  { key: 'wage_total', label: 'Average gross wage', short: 'Wage', format: czk },
  {
    key: 'flat_price_czk_m2',
    label: 'Flat price per m²',
    short: 'Flats',
    format: czk,
  },
  {
    key: 'unemployment_rate_pct',
    label: 'Unemployment rate',
    short: 'Unemployment',
    format: (v) => `${v.toFixed(2)} %`,
  },
  {
    key: 'population_total',
    label: 'Population',
    short: 'Population',
    format: (v) => Math.round(v).toLocaleString('en-US'),
  },
  {
    key: 'average_age',
    label: 'Average age',
    short: 'Age',
    format: (v) => `${v.toFixed(2)} yrs`,
  },
]
