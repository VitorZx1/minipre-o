import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import reportLogo from '../assets/mini-preco-logo-v2.png';

const RED = 'DC2626';
const DARK = '111827';
const MUTED = '64748B';
const BORDER = 'E2E8F0';
const GREEN = '059669';
const currency = value => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const shortDate = value => value instanceof Date ? value.toLocaleDateString('pt-BR') : String(value || '');

export function parseReportDate(value) {
  if (!value) return null;
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function inReportPeriod(value, start, end) {
  const date = parseReportDate(value);
  return Boolean(date && date >= start && date <= end);
}

export function buildReportData(data, start, end) {
  const vendas = data.vendas.filter(sale => inReportPeriod(sale.createdAt || sale.date, start, end));
  const financeiro = data.financeiro.filter(entry => inReportPeriod(entry.date, start, end));
  const compras = data.compras.filter(order => inReportPeriod(order.date, start, end));
  const estoque = data.estoque.filter(entry => inReportPeriod(entry.date, start, end));
  const totalVendas = vendas.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const descontos = vendas.reduce((sum, sale) => sum + Number(sale.discount || 0), 0);
  const itensVendidos = vendas.reduce((sum, sale) => sum + (sale.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0), 0);
  const receitas = financeiro.filter(entry => Number(entry.value) > 0).reduce((sum, entry) => sum + Number(entry.value || 0), 0);
  const despesas = financeiro.filter(entry => Number(entry.value) < 0).reduce((sum, entry) => sum + Math.abs(Number(entry.value || 0)), 0);
  const totalCompras = compras.reduce((sum, order) => sum + Number(order.totalReal ?? order.total ?? 0), 0);

  const paymentMap = {};
  vendas.forEach(sale => (sale.payments || []).forEach(payment => {
    const method = payment.method || 'Não informado';
    paymentMap[method] ||= { method, count: 0, total: 0 };
    paymentMap[method].count += 1;
    paymentMap[method].total += Number(payment.amount ?? sale.total ?? 0);
  }));

  const productMap = {};
  vendas.forEach(sale => (sale.items || []).forEach(item => {
    const key = item.productId || item.name;
    productMap[key] ||= { code: item.productId || '', name: item.name || '', quantity: 0, total: 0 };
    productMap[key].quantity += Number(item.quantity || 0);
    productMap[key].total += Number(item.quantity || 0) * Number(item.price || 0);
  }));

  const dailyMap = {};
  vendas.forEach(sale => {
    const date = parseReportDate(sale.createdAt || sale.date);
    if (!date) return;
    const key = date.toISOString().slice(0, 10);
    dailyMap[key] ||= { date, sales: 0, total: 0 };
    dailyMap[key].sales += 1;
    dailyMap[key].total += Number(sale.total || 0);
  });

  return {
    ...data,
    vendas, financeiro, compras, estoque,
    summary: {
      salesCount: vendas.length,
      totalVendas,
      descontos,
      ticketMedio: vendas.length ? totalVendas / vendas.length : 0,
      itensVendidos,
      receitas,
      despesas,
      saldo: receitas - despesas,
      totalCompras,
      produtosCadastrados: data.products.length,
      estoqueBaixo: data.products.filter(product => product.status === 'Ativo' && Number(product.stock) <= 10).length,
      valorEstoque: data.products.reduce((sum, product) => sum + Number(product.stock || 0) * Number(product.cost || 0), 0),
    },
    payments: Object.values(paymentMap).sort((a, b) => b.total - a.total),
    topProducts: Object.values(productMap).sort((a, b) => b.total - a.total),
    daily: Object.values(dailyMap).sort((a, b) => a.date - b.date),
  };
}

async function imageDataUrl(url) {
  const blob = await fetch(url).then(response => response.blob());
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function setupSheet(sheet, widths) {
  sheet.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }];
  sheet.properties.defaultRowHeight = 20;
  widths.forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
  sheet.eachRow(row => row.eachCell(cell => { cell.font ||= { name: 'Arial', size: 10, color: { argb: DARK } }; }));
}

function styleHeader(row) {
  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED } };
    cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'B91C1C' } } };
  });
  row.height = 24;
}

function addSheetHeading(sheet, title, period, lastColumn) {
  sheet.mergeCells(`A1:${lastColumn}1`);
  sheet.getCell('A1').value = title;
  sheet.getCell('A1').font = { name: 'Arial', size: 20, bold: true, color: { argb: DARK } };
  sheet.getCell('A2').value = `Período: ${period}`;
  sheet.getCell('A2').font = { name: 'Arial', size: 10, color: { argb: MUTED } };
  sheet.getCell('A3').value = `Gerado em ${new Date().toLocaleString('pt-BR')}`;
  sheet.getCell('A3').font = { name: 'Arial', size: 9, italic: true, color: { argb: '94A3B8' } };
}

function styleDetailSheet(sheet, logoId, lastColumn) {
  sheet.properties.tabColor = { argb: RED };
  sheet.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }];
  sheet.addImage(logoId, { tl: { col: Math.max(1, lastColumn - 2.4), row: 0.2 }, ext: { width: 165, height: 44 } });
  sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: lastColumn } };
  sheet.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 5) row.eachCell({ includeEmpty: true }, cell => {
      cell.font = { name: 'Arial', size: 10, color: { argb: DARK } };
      cell.border = { bottom: { style: 'hair', color: { argb: BORDER } } };
      if (rowNumber % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
    });
  });
}

function createChartImage({ title, subtitle, labels, values, type = 'line' }) {
  const width = 920;
  const height = 370;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#111827';
  ctx.font = '700 24px Arial';
  ctx.fillText(title, 32, 42);
  ctx.fillStyle = '#64748B';
  ctx.font = '14px Arial';
  ctx.fillText(subtitle, 32, 67);

  if (!values.length || values.every(value => Number(value) === 0)) {
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(32, 92, width - 64, height - 125);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Sem movimentação no período selecionado', width / 2, 220);
    ctx.textAlign = 'left';
    return canvas.toDataURL('image/png');
  }

  if (type === 'bars') {
    const max = Math.max(...values, 1);
    values.slice(0, 5).forEach((value, index) => {
      const y = 104 + index * 48;
      const barWidth = Math.max(4, (Number(value) / max) * 510);
      ctx.fillStyle = '#F1F5F9'; ctx.fillRect(210, y, 520, 22);
      ctx.fillStyle = index === 0 ? '#DC2626' : '#FB7185'; ctx.fillRect(210, y, barWidth, 22);
      ctx.fillStyle = '#334155'; ctx.font = '600 14px Arial'; ctx.fillText(String(labels[index] || '').slice(0, 19), 32, y + 16);
      ctx.fillStyle = '#111827'; ctx.textAlign = 'right'; ctx.fillText(currency(value), 870, y + 16); ctx.textAlign = 'left';
    });
    return canvas.toDataURL('image/png');
  }

  const left = 74; const right = 34; const top = 100; const bottom = 54;
  const plotWidth = width - left - right; const plotHeight = height - top - bottom;
  const max = Math.max(...values, 1);
  ctx.strokeStyle = '#E2E8F0'; ctx.lineWidth = 1;
  for (let step = 0; step <= 4; step += 1) {
    const y = top + (plotHeight / 4) * step;
    ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(width - right, y); ctx.stroke();
    ctx.fillStyle = '#94A3B8'; ctx.font = '12px Arial'; ctx.textAlign = 'right'; ctx.fillText(currency(max * (1 - step / 4)), left - 10, y + 4);
  }
  const points = values.map((value, index) => ({
    x: left + (values.length === 1 ? plotWidth / 2 : index * plotWidth / (values.length - 1)),
    y: top + plotHeight - (Number(value) / max) * plotHeight,
  }));
  const gradient = ctx.createLinearGradient(0, top, 0, top + plotHeight);
  gradient.addColorStop(0, 'rgba(220, 38, 38, .28)'); gradient.addColorStop(1, 'rgba(220, 38, 38, .02)');
  ctx.beginPath(); ctx.moveTo(points[0].x, top + plotHeight); points.forEach(point => ctx.lineTo(point.x, point.y));
  ctx.lineTo(points[points.length - 1].x, top + plotHeight); ctx.closePath(); ctx.fillStyle = gradient; ctx.fill();
  ctx.beginPath(); points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
  ctx.strokeStyle = '#DC2626'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.stroke();
  points.forEach((point, index) => {
    ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#DC2626'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(point.x, point.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (values.length <= 12 || index % Math.ceil(values.length / 8) === 0 || index === values.length - 1) {
      ctx.fillStyle = '#64748B'; ctx.font = '12px Arial'; ctx.textAlign = 'center'; ctx.fillText(String(labels[index] || ''), point.x, height - 22);
    }
  });
  ctx.textAlign = 'left';
  return canvas.toDataURL('image/png');
}

function addMetricCard(sheet, range, label, value, { currencyValue = false, accent = RED } = {}) {
  const [start, end] = range.split(':');
  sheet.mergeCells(range);
  const startCell = sheet.getCell(start);
  const startRow = startCell.row; const endRow = sheet.getCell(end).row;
  const startColumn = startCell.column; const endColumn = sheet.getCell(end).column;
  for (let row = startRow; row <= endRow; row += 1) for (let column = startColumn; column <= endColumn; column += 1) {
    const cell = sheet.getCell(row, column);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } };
    cell.border = {
      top: { style: 'thin', color: { argb: BORDER } }, bottom: { style: 'thin', color: { argb: BORDER } },
      right: { style: 'thin', color: { argb: BORDER } }, left: { style: column === startColumn ? 'medium' : 'thin', color: { argb: column === startColumn ? accent : BORDER } },
    };
  }
  startCell.value = { richText: [
    { font: { name: 'Arial', size: 10, bold: true, color: { argb: MUTED } }, text: `${label}\n` },
    { font: { name: 'Arial', size: 18, bold: true, color: { argb: DARK } }, text: currencyValue ? currency(value) : String(value) },
  ] };
  startCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };
}

export async function exportExcelReport(report, periodLabel, filename) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Mini Preço Variedades';
  workbook.created = new Date();
  const logoBase64 = await imageDataUrl(reportLogo);
  const logoId = workbook.addImage({ base64: logoBase64, extension: 'png' });

  const summary = workbook.addWorksheet('Painel', { views: [{ state: 'frozen', ySplit: 5, showGridLines: false }] });
  summary.properties.tabColor = { argb: RED };
  setupSheet(summary, Array(12).fill(15));
  for (let row = 1; row <= 44; row += 1) {
    summary.getRow(row).height = row <= 4 ? 25 : 22;
    for (let col = 1; col <= 12; col += 1) summary.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: row <= 4 ? 'EFF6FF' : 'F8FAFC' } };
  }
  summary.mergeCells('A1:H2'); summary.getCell('A1').value = 'Relatório gerencial';
  summary.getCell('A1').font = { name: 'Arial', size: 25, bold: true, color: { argb: DARK } }; summary.getCell('A1').alignment = { vertical: 'middle', indent: 1 };
  summary.mergeCells('A3:H3'); summary.getCell('A3').value = `Período: ${periodLabel}`;
  summary.getCell('A3').font = { name: 'Arial', size: 11, color: { argb: MUTED } }; summary.getCell('A3').alignment = { indent: 2 };
  summary.mergeCells('A4:H4'); summary.getCell('A4').value = `Atualizado em ${new Date().toLocaleString('pt-BR')}`;
  summary.getCell('A4').font = { name: 'Arial', size: 9, italic: true, color: { argb: MUTED } }; summary.getCell('A4').alignment = { indent: 2 };
  summary.addImage(logoId, { tl: { col: 8.65, row: 0.35 }, ext: { width: 255, height: 66 } });

  addMetricCard(summary, 'A6:C8', 'Faturamento', report.summary.totalVendas, { currencyValue: true });
  addMetricCard(summary, 'D6:F8', 'Vendas concluídas', report.summary.salesCount);
  addMetricCard(summary, 'G6:I8', 'Ticket médio', report.summary.ticketMedio, { currencyValue: true });
  addMetricCard(summary, 'J6:L8', 'Itens vendidos', report.summary.itensVendidos);
  addMetricCard(summary, 'A10:C12', 'Receitas', report.summary.receitas, { currencyValue: true, accent: GREEN });
  addMetricCard(summary, 'D10:F12', 'Despesas', report.summary.despesas, { currencyValue: true });
  addMetricCard(summary, 'G10:I12', 'Saldo', report.summary.saldo, { currencyValue: true, accent: report.summary.saldo < 0 ? RED : GREEN });
  addMetricCard(summary, 'J10:L12', 'Valor do estoque', report.summary.valorEstoque, { currencyValue: true, accent: '2563EB' });

  const dailyChart = workbook.addImage({ base64: createChartImage({ title: 'Faturamento por dia', subtitle: 'Evolução das vendas no período', labels: report.daily.map(item => shortDate(item.date).slice(0, 5)), values: report.daily.map(item => item.total) }), extension: 'png' });
  const paymentChart = workbook.addImage({ base64: createChartImage({ title: 'Formas de pagamento', subtitle: 'Participação no faturamento', labels: report.payments.map(item => item.method), values: report.payments.map(item => item.total), type: 'bars' }), extension: 'png' });
  summary.addImage(dailyChart, { tl: { col: 0.25, row: 13.2 }, ext: { width: 690, height: 278 } });
  summary.addImage(paymentChart, { tl: { col: 7.35, row: 13.2 }, ext: { width: 430, height: 278 } });

  summary.mergeCells('A28:G28'); summary.getCell('A28').value = 'Produtos mais vendidos'; summary.getCell('A28').font = { name: 'Arial', size: 14, bold: true, color: { argb: DARK } };
  summary.getCell('A30').value = 'Código'; summary.mergeCells('B30:C30'); summary.getCell('B30').value = 'Produto'; summary.mergeCells('D30:E30'); summary.getCell('D30').value = 'Quantidade'; summary.mergeCells('F30:G30'); summary.getCell('F30').value = 'Total vendido';
  for (let col = 1; col <= 7; col += 1) { const cell = summary.getCell(30, col); cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: DARK } }; cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' } }; cell.alignment = { vertical: 'middle', horizontal: 'center' }; }
  const products = report.topProducts.slice(0, 8);
  (products.length ? products : [{ code: '', name: 'Nenhum produto vendido no período', quantity: 0, total: 0 }]).forEach((item, index) => {
    const target = 31 + index; summary.getCell(target, 1).value = item.code; summary.mergeCells(target, 2, target, 3); summary.getCell(target, 2).value = item.name;
    summary.mergeCells(target, 4, target, 5); summary.getCell(target, 4).value = item.quantity; summary.mergeCells(target, 6, target, 7); summary.getCell(target, 6).value = item.total; summary.getCell(target, 6).numFmt = 'R$ #,##0.00';
    for (let col = 1; col <= 7; col += 1) { const cell = summary.getCell(target, col); cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 ? 'F8FAFC' : 'FFFFFF' } }; cell.border = { bottom: { style: 'hair', color: { argb: BORDER } } }; cell.font = { name: 'Arial', size: 10, color: { argb: DARK } }; cell.alignment = { vertical: 'middle' }; }
  });
  summary.mergeCells('I28:L28'); summary.getCell('I28').value = 'Visão operacional'; summary.getCell('I28').font = { name: 'Arial', size: 14, bold: true, color: { argb: DARK } };
  [['Produtos cadastrados', report.summary.produtosCadastrados], ['Estoque baixo', report.summary.estoqueBaixo], ['Compras no período', currency(report.summary.totalCompras)], ['Descontos concedidos', currency(report.summary.descontos)]].forEach(([label, value], index) => {
    const target = 30 + index * 2; summary.mergeCells(target, 9, target + 1, 10); summary.mergeCells(target, 11, target + 1, 12);
    summary.getCell(target, 9).value = label; summary.getCell(target, 11).value = value;
    [summary.getCell(target, 9), summary.getCell(target, 11)].forEach((cell, cellIndex) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF' } }; cell.font = { name: 'Arial', bold: true, size: cellIndex ? 13 : 10, color: { argb: cellIndex ? (label === 'Estoque baixo' && Number(value) > 0 ? RED : DARK) : MUTED } }; cell.alignment = { vertical: 'middle', horizontal: cellIndex ? 'right' : 'left', indent: 1 }; cell.border = { top: { style: 'thin', color: { argb: BORDER } }, bottom: { style: 'thin', color: { argb: BORDER } } }; });
  });
  summary.mergeCells('I39:L40'); summary.getCell('I39').value = 'Resumo visual do período selecionado'; summary.getCell('I39').font = { name: 'Arial', size: 10, italic: true, color: { argb: MUTED } }; summary.getCell('I39').alignment = { vertical: 'middle', horizontal: 'center' };
  summary.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 1, printArea: 'A1:L41', margins: { left: 0.2, right: 0.2, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 } };

  const detailSheets = [
    { name: 'Vendas', title: 'Detalhamento de vendas', widths: [14, 22, 20, 20, 16, 30, 12, 16, 16], headers: ['Data', 'Venda', 'Operador', 'Pagamento', 'Código', 'Produto', 'Quantidade', 'Preço unitário', 'Total do item'], rows: report.vendas.flatMap(sale => (sale.items || []).map(item => [parseReportDate(sale.createdAt || sale.date), sale.id, sale.operator, sale.payments?.[0]?.method || '', item.productId, item.name, Number(item.quantity || 0), Number(item.price || 0), Number(item.quantity || 0) * Number(item.price || 0)])), currencyColumns: [8, 9], dateColumns: [1], empty: ['', '', '', '', '', 'Nenhuma venda no período'] },
    { name: 'Financeiro', title: 'Movimentações financeiras', widths: [14, 16, 38, 22, 18, 16], headers: ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor', 'Status'], rows: report.financeiro.map(entry => [parseReportDate(entry.date), entry.type, entry.description, entry.category, Number(entry.value || 0), entry.status]), currencyColumns: [5], dateColumns: [1], empty: ['', '', 'Nenhum lançamento no período'] },
    { name: 'Compras', title: 'Compras e fornecedores', widths: [14, 22, 34, 18, 18, 18], headers: ['Data', 'Pedido', 'Fornecedor', 'Previsto', 'Realizado', 'Status'], rows: report.compras.map(order => [parseReportDate(order.date), order.id, order.supplier, Number(order.total || 0), order.totalReal == null ? null : Number(order.totalReal), order.status]), currencyColumns: [4, 5], dateColumns: [1], empty: ['', '', 'Nenhuma compra no período'] },
    { name: 'Estoque atual', title: 'Posição atual de estoque', widths: [16, 36, 22, 14, 14, 16, 16, 18], headers: ['Código', 'Produto', 'Categoria', 'Unidade', 'Estoque', 'Custo', 'Preço', 'Valor em estoque'], rows: report.products.map(product => [product.id, product.name, product.category, product.unit, Number(product.stock || 0), Number(product.cost || 0), Number(product.price || 0), Number(product.stock || 0) * Number(product.cost || 0)]), currencyColumns: [6, 7, 8], dateColumns: [], empty: ['', 'Nenhum produto cadastrado'] },
    { name: 'Mov. estoque', title: 'Movimentações de estoque', widths: [14, 18, 34, 14, 22, 22, 16], headers: ['Data', 'Tipo', 'Produto', 'Quantidade', 'Documento', 'Responsável', 'Status'], rows: report.estoque.map(entry => [parseReportDate(entry.date), entry.type, entry.product, Number(entry.quantity || 0), entry.document, entry.responsible, entry.status]), currencyColumns: [], dateColumns: [1], empty: ['', '', 'Nenhuma movimentação no período'] },
    { name: 'Fornecedores', title: 'Cadastro de fornecedores', widths: [16, 34, 22, 22, 20, 18, 14], headers: ['Código', 'Fornecedor', 'Categoria', 'CNPJ', 'Cidade', 'Contato', 'Status'], rows: report.suppliers.map(supplier => [supplier.id, supplier.name, supplier.category, supplier.cnpj, supplier.city, supplier.contact, supplier.status]), currencyColumns: [], dateColumns: [], empty: ['', 'Nenhum fornecedor cadastrado'] },
  ];
  detailSheets.forEach(definition => {
    const sheet = workbook.addWorksheet(definition.name);
    setupSheet(sheet, definition.widths); addSheetHeading(sheet, definition.title, periodLabel, sheet.getColumn(definition.headers.length).letter);
    sheet.getRow(5).values = definition.headers; styleHeader(sheet.getRow(5));
    (definition.rows.length ? definition.rows : [definition.empty]).forEach(values => {
      const row = sheet.addRow(values);
      definition.currencyColumns.forEach(column => { row.getCell(column).numFmt = 'R$ #,##0.00;[Red]-R$ #,##0.00'; });
      definition.dateColumns.forEach(column => { row.getCell(column).numFmt = 'dd/mm/yyyy'; });
    });
    styleDetailSheet(sheet, logoId, definition.headers.length);
  });
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
}

function pdfSection(doc, title, head, body, startY) {
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(17, 24, 39); doc.text(title, 14, startY);
  autoTable(doc, { startY: startY + 4, head: [head], body, theme: 'grid', styles: { fontSize: 8, cellPadding: 2.2, overflow: 'linebreak' }, headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' }, alternateRowStyles: { fillColor: [249, 250, 251] }, margin: { left: 14, right: 14 } });
  return doc.lastAutoTable.finalY + 9;
}

export async function exportPdfReport(report, periodLabel, filename) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const logo = await imageDataUrl(reportLogo);
  doc.addImage(logo, 'PNG', 224, 9, 58, 16, undefined, 'FAST');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(17, 24, 39); doc.text('Relatório gerencial', 14, 18);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(107, 114, 128); doc.text(`Período: ${periodLabel}`, 14, 25); doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 30);
  const cards = [
    ['Faturamento', currency(report.summary.totalVendas)], ['Vendas', String(report.summary.salesCount)], ['Ticket médio', currency(report.summary.ticketMedio)],
    ['Receitas', currency(report.summary.receitas)], ['Despesas', currency(report.summary.despesas)], ['Saldo', currency(report.summary.saldo)],
    ['Itens vendidos', String(report.summary.itensVendidos)], ['Compras', currency(report.summary.totalCompras)], ['Valor do estoque', currency(report.summary.valorEstoque)],
  ];
  cards.forEach((card, index) => {
    const col = index % 3; const row = Math.floor(index / 3); const x = 14 + col * 92; const y = 38 + row * 19;
    doc.setFillColor(249, 250, 251); doc.setDrawColor(229, 231, 235); doc.roundedRect(x, y, 86, 15, 2, 2, 'FD');
    doc.setFontSize(7); doc.setTextColor(107, 114, 128); doc.text(card[0], x + 4, y + 5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(index === 5 && report.summary.saldo < 0 ? 220 : 17, index === 5 && report.summary.saldo < 0 ? 38 : 24, index === 5 && report.summary.saldo < 0 ? 38 : 39); doc.text(card[1], x + 4, y + 11); doc.setFont('helvetica', 'normal');
  });
  let y = 101;
  y = pdfSection(doc, 'Vendas por forma de pagamento', ['Forma de pagamento', 'Quantidade', 'Total'], report.payments.length ? report.payments.map(item => [item.method, item.count, currency(item.total)]) : [['Nenhuma venda no período', '0', currency(0)]], y);
  y = pdfSection(doc, 'Produtos vendidos', ['Código', 'Produto', 'Quantidade', 'Total'], report.topProducts.length ? report.topProducts.map(item => [item.code, item.name, item.quantity, currency(item.total)]) : [['', 'Nenhum produto vendido no período', '0', currency(0)]], y);
  pdfSection(doc, 'Vendas por dia', ['Data', 'Quantidade de vendas', 'Faturamento'], report.daily.length ? report.daily.map(item => [shortDate(item.date), item.sales, currency(item.total)]) : [['', 0, currency(0)]], y);

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page); doc.setFontSize(8); doc.setTextColor(156, 163, 175); doc.text(`Mini Preço Variedades - página ${page} de ${pages}`, 283, 202, { align: 'right' });
  }
  doc.save(filename);
}
