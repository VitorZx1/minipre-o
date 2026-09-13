import { useMemo, useState } from 'react';
import { BarChart3, CalendarDays, Download, FileSpreadsheet, FileText, ShoppingCart, TrendingDown, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildReportData, exportExcelReport, exportPdfReport } from '../services/reportExporter';

const money = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const toInputDate = date => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

function periodDates(mode, referenceDate, customStart, customEnd) {
  const reference = new Date(`${referenceDate}T12:00:00`);
  let start = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  let end = new Date(start);
  if (mode === 'week') {
    const offset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - offset);
    end = new Date(start); end.setDate(start.getDate() + 6);
  } else if (mode === 'month') {
    start = new Date(reference.getFullYear(), reference.getMonth(), 1);
    end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  } else if (mode === 'year') {
    start = new Date(reference.getFullYear(), 0, 1);
    end = new Date(reference.getFullYear(), 11, 31);
  } else if (mode === 'custom') {
    start = new Date(`${customStart}T12:00:00`);
    end = new Date(`${customEnd}T12:00:00`);
  }
  return { start, end };
}

const periodOptions = [
  { value: 'day', label: 'Diário' },
  { value: 'week', label: 'Semanal' },
  { value: 'month', label: 'Mensal' },
  { value: 'year', label: 'Anual' },
  { value: 'custom', label: 'Período personalizado' },
];

const metricColors = {
  emerald: { background: 'bg-emerald-50', icon: 'text-emerald-600' },
  red: { background: 'bg-red-50', icon: 'text-red-600' },
  blue: { background: 'bg-blue-50', icon: 'text-blue-600' },
  amber: { background: 'bg-amber-50', icon: 'text-amber-600' },
};

export default function Relatorios() {
  const { vendas, financeiro, compras, estoque, products, suppliers, user, addAudit, showToast } = useApp();
  const today = toInputDate(new Date());
  const [mode, setMode] = useState('day');
  const [referenceDate, setReferenceDate] = useState(today);
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(today);
  const [exporting, setExporting] = useState('');
  const dates = useMemo(() => periodDates(mode, referenceDate, customStart, customEnd), [mode, referenceDate, customStart, customEnd]);
  const validPeriod = !Number.isNaN(dates.start.getTime()) && !Number.isNaN(dates.end.getTime()) && dates.start <= dates.end;
  const report = useMemo(() => validPeriod ? buildReportData({ vendas, financeiro, compras, estoque, products, suppliers }, dates.start, dates.end) : null, [validPeriod, vendas, financeiro, compras, estoque, products, suppliers, dates]);
  const periodLabel = validPeriod ? `${dates.start.toLocaleDateString('pt-BR')} a ${dates.end.toLocaleDateString('pt-BR')}` : 'Período inválido';
  const safePeriod = validPeriod ? `${toInputDate(dates.start)}_a_${toInputDate(dates.end)}` : 'periodo';

  async function handleExport(format) {
    if (!report || !validPeriod) return showToast('Selecione um período válido.', 'error');
    setExporting(format);
    try {
      if (format === 'excel') await exportExcelReport(report, periodLabel, `relatorio-mini-preco_${safePeriod}.xlsx`);
      else await exportPdfReport(report, periodLabel, `relatorio-mini-preco_${safePeriod}.pdf`);
      addAudit('Relatórios', 'Exportação', format.toUpperCase(), `Relatório de ${periodLabel} exportado por ${user?.name || 'ADMINISTRADOR'}`);
      showToast(`Relatório em ${format === 'excel' ? 'Excel' : 'PDF'} exportado com sucesso!`);
    } catch (error) {
      showToast(`Não foi possível gerar o relatório: ${error.message}`, 'error');
    } finally {
      setExporting('');
    }
  }

  const metrics = report ? [
    { label: 'Faturamento', value: money(report.summary.totalVendas), icon: TrendingUp, color: 'emerald' },
    { label: 'Despesas', value: money(report.summary.despesas), icon: TrendingDown, color: 'red' },
    { label: 'Saldo financeiro', value: money(report.summary.saldo), icon: BarChart3, color: report.summary.saldo >= 0 ? 'blue' : 'red' },
    { label: 'Vendas realizadas', value: report.summary.salesCount.toLocaleString('pt-BR'), icon: ShoppingCart, color: 'amber' },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
        <p className="text-sm text-gray-500">Acompanhe os resultados e exporte informações detalhadas.</p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-red-600" />
          <h2 className="font-semibold text-gray-800">Período do relatório</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {periodOptions.map(option => <button key={option.value} type="button" onClick={() => setMode(option.value)} className={`rounded-lg border px-4 py-3 text-sm font-medium ${mode === option.value ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-600 hover:border-red-200'}`}>{option.label}</button>)}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {mode !== 'custom' ? <label className="block"><span className="mb-1.5 block text-sm font-medium text-gray-700">{mode === 'day' ? 'Dia do relatório' : 'Data de referência'}</span><input type="date" value={referenceDate} onChange={event => setReferenceDate(event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" /></label> : <><label className="block"><span className="mb-1.5 block text-sm font-medium text-gray-700">Data inicial</span><input type="date" value={customStart} onChange={event => setCustomStart(event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" /></label><label className="block"><span className="mb-1.5 block text-sm font-medium text-gray-700">Data final</span><input type="date" value={customEnd} min={customStart} onChange={event => setCustomEnd(event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" /></label></>}
        </div>
        <div className={`mt-4 rounded-lg px-4 py-3 text-sm ${validPeriod ? 'bg-gray-50 text-gray-600' : 'bg-red-50 text-red-700'}`}>{validPeriod ? <>Dados considerados de <strong>{periodLabel}</strong>.</> : 'A data inicial deve ser anterior ou igual à data final.'}</div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, color }) => <div key={label} className="rounded-xl border border-gray-200 bg-white p-5"><div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${metricColors[color].background}`}><Icon className={`h-5 w-5 ${metricColors[color].icon}`} /></div><p className="text-xs font-medium text-gray-500">{label}</p><p className="mt-1 text-xl font-bold text-gray-800">{value}</p></div>)}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-800">Resumo do período</h2>
          <div className="mt-4 divide-y divide-gray-100 text-sm">
            {report && [['Itens vendidos', report.summary.itensVendidos], ['Ticket médio', money(report.summary.ticketMedio)], ['Receitas registradas', money(report.summary.receitas)], ['Compras', money(report.summary.totalCompras)], ['Descontos concedidos', money(report.summary.descontos)], ['Produtos com estoque baixo', report.summary.estoqueBaixo]].map(([label, value]) => <div key={label} className="flex justify-between py-3"><span className="text-gray-500">{label}</span><strong className="text-gray-800">{value}</strong></div>)}
          </div>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-800">Formas de pagamento</h2>
          <div className="mt-4 space-y-3">
            {report?.payments.length ? report.payments.map(payment => <div key={payment.method} className="flex items-center justify-between rounded-lg bg-gray-50 p-3"><div><p className="text-sm font-medium text-gray-800">{payment.method}</p><p className="text-xs text-gray-500">{payment.count} venda(s)</p></div><strong className="text-sm text-gray-800">{money(payment.total)}</strong></div>) : <p className="rounded-lg bg-gray-50 p-5 text-center text-sm text-gray-400">Nenhuma venda no período.</p>}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div><h2 className="font-semibold text-gray-800">Exportar relatório</h2><p className="mt-1 text-sm text-gray-500">O Excel traz o resumo visual. O PDF contém o relatório completo e detalhado.</p></div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" disabled={!validPeriod || Boolean(exporting)} onClick={() => handleExport('excel')} className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><FileSpreadsheet className="h-5 w-5" />{exporting === 'excel' ? 'Gerando Excel...' : 'Exportar Excel'}</button>
            <button type="button" disabled={!validPeriod || Boolean(exporting)} onClick={() => handleExport('pdf')} className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"><FileText className="h-5 w-5" />{exporting === 'pdf' ? 'Gerando PDF...' : 'Exportar PDF'}</button>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-xs text-blue-700"><Download className="h-4 w-4 shrink-0" />O arquivo será salvo na pasta de downloads deste computador.</div>
      </section>
    </div>
  );
}
