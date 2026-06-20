'use client'

interface RelatoriosPeriodSelectorProps {
  value: string
}

export function RelatoriosPeriodSelector({ value }: RelatoriosPeriodSelectorProps) {
  return (
    <select
      name="period"
      className="sel-period"
      defaultValue={value}
      onChange={(e) => {
        const url = new URL(window.location.href)
        url.searchParams.set('period', e.target.value)
        window.location.href = url.toString()
      }}
    >
      <option value="12m">Últimos 12 meses</option>
      <option value="6m">Últimos 6 meses</option>
    </select>
  )
}
