import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Database, FolderOpen, HardDrive, ImagePlus, Printer, ReceiptText, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import CardMachineSettings from '../components/CardMachineSettings';
import ReceiptLogo from '../components/ReceiptLogo';
import { localServer } from '../services/localServer';

const labels = {
  products: 'Produtos', suppliers: 'Fornecedores', financeiro: 'Financeiro',
  users: 'Usuários', compras: 'Compras', estoque: 'Movimentações', vendas: 'Vendas do PDV', audit: 'Auditoria',
};

export default function ArmazenamentoLocal() {
  const { user, storageInfo, storageReady, refreshStorageInfo, changeStorageDirectory, receiptSettings, updateReceiptSettings, showToast } = useApp();
  const [directory, setDirectory] = useState(null);
  const [receiptDraft, setReceiptDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [choosing, setChoosing] = useState(false);
  if (user?.login !== 'adm') return <Navigate to="/" replace />;

  const displayedDirectory = directory ?? storageInfo.storageDirectory ?? '';
  const receipt = receiptDraft ?? receiptSettings;

  async function save() {
    if (!displayedDirectory.trim()) return showToast('Informe uma pasta válida.', 'error');
    setSaving(true);
    try {
      await changeStorageDirectory(displayedDirectory.trim());
      setDirectory(null);
      showToast('Pasta de armazenamento atualizada.');
    } catch (error) {
      showToast(error.message, 'error');
    } finally { setSaving(false); }
  }

  async function chooseFolder() {
    setChoosing(true);
    try {
      const result = await localServer.chooseStorageFolder();
      if (result.directory) setDirectory(result.directory);
    } catch (error) { showToast(error.message, 'error'); }
    finally { setChoosing(false); }
  }

  async function refresh() {
    try { await refreshStorageInfo(); showToast('Conexão verificada.'); }
    catch (error) { showToast(error.message, 'error'); }
  }

  function updateReceipt(field, value) {
    setReceiptDraft(current => ({ ...(current ?? receiptSettings), [field]: value }));
  }

  function selectLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return showToast('Escolha uma imagem de até 1 MB.', 'error');
    const reader = new FileReader();
    reader.onload = () => updateReceipt('logo', reader.result);
    reader.readAsDataURL(file);
  }

  async function saveReceipt() {
    try {
      await updateReceiptSettings(receipt);
      setReceiptDraft(null);
      showToast('Modelo do comprovante salvo.');
    } catch (error) { showToast(error.message, 'error'); }
  }

  const size = storageInfo.databaseSize
    ? `${(storageInfo.databaseSize / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} KB`
    : '0 KB';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Área administrativa</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Armazenamento local</h1>
          <p className="text-sm text-gray-500 mt-1">Banco de dados utilizado por todas as telas e pelos futuros relatórios.</p>
        </div>
        <div className={`px-3 py-2 rounded-lg text-sm font-semibold ${storageInfo.connected ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {storageReady && storageInfo.connected ? 'Banco conectado' : 'Banco indisponível'}
        </div>
      </div>

      <CardMachineSettings showToast={showToast} />

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><FolderOpen className="w-5 h-5 text-red-600" /></div>
          <div><h2 className="font-semibold text-gray-800">Local dos dados</h2><p className="text-xs text-gray-500">Ao trocar a pasta, o banco atual é copiado para o novo local.</p></div>
        </div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Pasta de armazenamento</label>
        <div className="flex flex-wrap gap-3">
          <input value={displayedDirectory} onChange={event => setDirectory(event.target.value)} placeholder="Ex.: C:\Mini Preço\Dados" className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500" />
          <button onClick={chooseFolder} disabled={choosing || saving || !storageInfo.connected} className="flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm disabled:opacity-50"><FolderOpen className="w-4 h-4" />{choosing ? 'Escolha na janela do Windows...' : 'Escolher pasta'}</button>
          <button onClick={save} disabled={saving || choosing || !storageInfo.connected} className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar local'}</button>
        </div>
        <p className="text-xs text-gray-500 mt-3">Escolher pasta abre o seletor no computador onde o servidor local está rodando. A mudança só é aplicada ao clicar em Salvar local.</p>
        <p className="text-xs text-gray-500 mt-3 break-all">Arquivo atual: {storageInfo.databasePath || 'aguardando conexão...'}</p>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"><ReceiptText className="w-5 h-5 text-slate-700" /></div><div><h2 className="font-semibold text-gray-800">Configuração do comprovante</h2><p className="text-xs text-gray-500">Personalize o comprovante não fiscal emitido após cada venda.</p></div></div>
          <button onClick={saveReceipt} className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Salvar modelo</button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 p-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logotipo</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50"><ImagePlus className="w-4 h-4" /> Escolher imagem<input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectLogo} className="hidden" /></label>
                {receipt.logo !== null && <button onClick={() => updateReceipt('logo', null)} className="flex items-center gap-1.5 text-sm text-red-600"><Trash2 className="w-4 h-4" /> Remover</button>}
              </div>
              <button onClick={() => updateReceipt('logo', '')} className="text-sm text-gray-700 underline mt-2">Usar logo Mini Preço</button>
              <p className="text-xs text-gray-500 mt-2">A logo Mini Preço já é usada por padrão. Você pode trocar por PNG, JPG ou WebP de até 1 MB. O comprovante usa preto e branco com alto contraste.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm text-gray-700 col-span-2">Nome exibido<input value={receipt.companyName} onChange={event => updateReceipt('companyName', event.target.value)} className="mt-1.5 w-full px-3 py-2 border rounded-lg" /></label>
              <label className="text-sm text-gray-700 col-span-2">Razão social<input value={receipt.legalName} onChange={event => updateReceipt('legalName', event.target.value)} placeholder="Opcional" className="mt-1.5 w-full px-3 py-2 border rounded-lg" /></label>
              <label className="text-sm text-gray-700">CNPJ<input value={receipt.cnpj} onChange={event => updateReceipt('cnpj', event.target.value)} placeholder="00.000.000/0001-00" className="mt-1.5 w-full px-3 py-2 border rounded-lg" /></label>
              <label className="text-sm text-gray-700">Telefone<input value={receipt.phone} onChange={event => updateReceipt('phone', event.target.value)} placeholder="(00) 00000-0000" className="mt-1.5 w-full px-3 py-2 border rounded-lg" /></label>
              <label className="text-sm text-gray-700 col-span-2">Endereço<input value={receipt.address} onChange={event => updateReceipt('address', event.target.value)} placeholder="Rua, número e bairro" className="mt-1.5 w-full px-3 py-2 border rounded-lg" /></label>
              <label className="text-sm text-gray-700 col-span-2">Cidade / UF<input value={receipt.city} onChange={event => updateReceipt('city', event.target.value)} placeholder="Linhares / ES" className="mt-1.5 w-full px-3 py-2 border rounded-lg" /></label>
              <label className="text-sm text-gray-700 col-span-2">Mensagem final<textarea value={receipt.footerMessage} onChange={event => updateReceipt('footerMessage', event.target.value)} rows="3" className="mt-1.5 w-full px-3 py-2 border rounded-lg resize-none" /></label>
              <label className="text-sm text-gray-700">Largura do papel<select value={receipt.paperWidth} onChange={event => updateReceipt('paperWidth', event.target.value)} className="mt-1.5 w-full px-3 py-2 border rounded-lg bg-white"><option value="80">80 mm</option><option value="58">58 mm</option></select></label>
              <label className="text-sm text-gray-700">Quantidade de vias<input type="number" min="1" max="3" value={receipt.copies} onChange={event => updateReceipt('copies', Math.min(3, Math.max(1, Number(event.target.value) || 1)))} className="mt-1.5 w-full px-3 py-2 border rounded-lg" /></label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[['autoPrint', 'Imprimir após cada venda'], ['showOperator', 'Mostrar operador'], ['showProductCode', 'Mostrar códigos']].map(([field, label]) => <label key={field} className="flex items-center gap-2 p-3 border rounded-lg text-sm text-gray-700"><input type="checkbox" checked={receipt[field]} onChange={event => updateReceipt(field, event.target.checked)} className="accent-red-600" /> {label}</label>)}
            </div>
          </div>

          <div className="bg-gray-100 rounded-xl p-5 flex flex-col items-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Prévia do comprovante</p>
            <div className="thermal-receipt bg-white shadow-md p-5 font-mono text-black" style={{ width: receipt.paperWidth === '58' ? '245px' : '320px' }}>
              <div className="text-center pb-3 border-b border-dashed border-black">
                <ReceiptLogo settings={receipt} />
                <p className="font-black text-base">{receipt.companyName || 'NOME DA EMPRESA'}</p>
                {receipt.legalName && <p className="text-[10px]">{receipt.legalName}</p>}
                {receipt.cnpj && <p className="text-[10px]">CNPJ: {receipt.cnpj}</p>}
                {receipt.address && <p className="text-[10px]">{receipt.address}</p>}
                {receipt.city && <p className="text-[10px]">{receipt.city}</p>}
                {receipt.phone && <p className="text-[10px]">Tel.: {receipt.phone}</p>}
              </div>
              <div className="py-2 text-[10px] border-b border-dashed border-black"><p>VEN-2026-000123</p><p>29/08/2026 18:45 · CAIXA 01</p>{receipt.showOperator && <p>Operador: ADMINISTRADOR</p>}</div>
              <div className="py-2 text-[10px] border-b border-dashed border-black"><p className="font-bold">{receipt.showProductCode && 'PROD-001 · '}Arroz Tipo 1 5kg</p><div className="flex justify-between"><span>2 x R$ 25,90</span><span>R$ 51,80</span></div><p className="font-bold mt-1">Feijão Carioca 1kg</p><div className="flex justify-between"><span>1 x R$ 8,99</span><span>R$ 8,99</span></div></div>
              <div className="py-2 text-[11px]"><div className="flex justify-between"><span>Subtotal</span><span>R$ 60,79</span></div><div className="flex justify-between font-black text-sm"><span>TOTAL</span><span>R$ 60,79</span></div><div className="flex justify-between"><span>Dinheiro</span><span>R$ 60,79</span></div></div>
              <div className="text-center pt-2 border-t border-dashed border-black"><p className="text-[10px] whitespace-pre-line">{receipt.footerMessage}</p><p className="text-[9px] font-bold mt-2">COMPROVANTE NÃO FISCAL</p><p className="text-[9px]">NÃO É DOCUMENTO FISCAL</p></div>
            </div>
            <button onClick={() => window.print()} className="mt-4 flex items-center gap-2 text-sm text-gray-700"><Printer className="w-4 h-4" /> Imprimir teste</button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-4"><Database className="w-5 h-5 text-gray-600" /><h2 className="font-semibold text-gray-800">Registros por área</h2></div>
          <div className="space-y-2">
            {Object.entries(storageInfo.rowCounts || {}).map(([key, total]) => (
              <div key={key} className="flex justify-between text-sm py-1.5 border-b border-gray-100 last:border-0"><span className="text-gray-600">{labels[key] || key}</span><strong className="text-gray-800">{total}</strong></div>
            ))}
          </div>
        </section>
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-4"><HardDrive className="w-5 h-5 text-gray-600" /><h2 className="font-semibold text-gray-800">Integridade</h2></div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Formato</dt><dd className="font-medium">SQLite</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Tamanho atual</dt><dd className="font-medium">{size}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Filtro por período</dt><dd className="font-medium text-emerald-600">Indexado por data</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Acesso externo</dt><dd className="font-medium">Bloqueado</dd></div>
          </dl>
          <button onClick={refresh} className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Verificar conexão</button>
        </section>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        Não mova ou edite o arquivo do banco enquanto o Mini Preço estiver aberto. A rotina automática de backup será configurada junto com o empacotamento do aplicativo.
      </div>
    </div>
  );
}
