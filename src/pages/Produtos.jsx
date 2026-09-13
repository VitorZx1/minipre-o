import { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { Plus, Edit, Trash2, Power, Search, X, ScanBarcode, CheckCircle2, LoaderCircle } from 'lucide-react';
import { categories, units } from '../data/seed';
import { localServer } from '../services/localServer';

export default function Produtos() {
  const { products, addProduct, updateProduct, deleteProduct, inactivateProduct, showToast } = useApp();
  const barcodeRef = useRef(null);
  const conferenceRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'new', 'edit', 'confirmDelete'
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({});
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');
  const [conferenceOpen, setConferenceOpen] = useState(false);
  const [conferenceCode, setConferenceCode] = useState('');
  const [conferenceResult, setConferenceResult] = useState(null);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !search || p.id.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase()) || String(p.internalCode || '').toLowerCase().includes(search.toLowerCase());
      const matchCategory = !filterCategory || p.category === filterCategory;
      const matchStatus = !filterStatus || p.status === filterStatus;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, search, filterCategory, filterStatus]);

  const columns = [
    { header: 'Código', accessor: 'id', width: '100px' },
    { header: 'Código interno', accessor: 'internalCode', render: (row) => <span className="font-mono text-xs font-semibold">{row.internalCode || '—'}</span> },
    { header: 'Descrição', accessor: 'name' },
    { header: 'Código de barras', accessor: 'barcode', render: (row) => <span className="font-mono text-xs text-gray-600">{row.barcode || '—'}</span> },
    { header: 'Categoria', accessor: 'category', render: (row) => <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium">{row.category}</span> },
    { header: 'Unidade', accessor: 'unit', width: '80px' },
    { header: 'Preço Custo', accessor: 'cost', render: (row) => <span className="text-gray-500">R$ {Number(row.cost).toFixed(2)}</span> },
    { header: 'Preço Venda', accessor: 'price', render: (row) => <span className="font-semibold text-emerald-600">R$ {Number(row.price).toFixed(2)}</span> },
    { header: 'Estoque', accessor: 'stock', render: (row) => {
      const color = row.stock === 0 ? 'text-red-600 bg-red-50' : row.stock <= 10 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50';
      return <span className={`px-2 py-1 rounded-md text-xs font-bold ${color}`}>{row.stock}</span>;
    }},
    { header: 'Fornecedor', accessor: 'supplier' },
    { header: 'Status', accessor: 'status', render: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
        {row.status}
      </span>
    )},
  ];

  const handleNew = () => {
    setForm({ internalCode: '', barcode: '', name: '', category: 'Mercearia', unit: 'Unidade', soldByWeight: false, cost: '', price: '', stock: 0, supplier: '', status: 'Ativo' });
    setModalType('new');
    setModalOpen(true);
    setLookupMessage('');
    setTimeout(() => barcodeRef.current?.focus(), 50);
  };

  const openConference = () => {
    setConferenceCode('');
    setConferenceResult(null);
    setConferenceOpen(true);
    setTimeout(() => conferenceRef.current?.focus(), 50);
  };

  const checkRegisteredProduct = () => {
    const barcode = String(conferenceCode || '').replace(/\D/g, '');
    if (!barcode) return;
    const product = products.find(item => String(item.barcode || '') === barcode);
    setConferenceCode(barcode);
    setConferenceResult(product ? { found: true, product } : { found: false, barcode });
    setTimeout(() => conferenceRef.current?.focus(), 50);
  };

  const registerConferenceProduct = () => {
    const barcode = conferenceResult?.barcode || conferenceCode;
    setConferenceOpen(false);
    setForm({ internalCode: '', barcode, name: '', category: 'Mercearia', unit: 'Unidade', soldByWeight: false, cost: '', price: '', stock: 0, supplier: '', status: 'Ativo' });
    setModalType('new');
    setModalOpen(true);
    setLookupMessage('');
    setTimeout(() => barcodeRef.current?.focus(), 50);
  };

  async function lookupBarcode() {
    const barcode = String(form.barcode || '').replace(/\D/g, '');
    if (!barcode) return;
    if (products.some(product => product.barcode === barcode && product.id !== selected?.id)) {
      showToast('Este código de barras já pertence a outro produto.', 'error');
      return;
    }
    setLookupBusy(true); setLookupMessage('Consultando o produto...');
    try {
      const result = await localServer.lookupProduct(barcode);
      if (!result.found) {
        setLookupMessage('Produto não encontrado na base pública. Preencha os dados manualmente.');
        return;
      }
      setForm(current => ({ ...current, barcode, name: result.name, category: result.category, unit: result.unit }));
      setLookupMessage(`Produto identificado${result.quantity ? ` · Embalagem: ${result.quantity}` : ''}. Confira os dados e informe os preços.`);
      showToast('Descrição, categoria e unidade preenchidas automaticamente.');
    } catch (error) { setLookupMessage(error.message); showToast(error.message, 'error'); }
    finally { setLookupBusy(false); }
  }

  const handleEdit = () => {
    if (!selected) return;
    setForm({ ...selected, soldByWeight: selected.soldByWeight ?? selected.unit === 'kg' });
    setModalType('edit');
    setModalOpen(true);
  };

  const handleSave = () => {
    const normalizedBarcode = String(form.barcode || '').replace(/\D/g, '');
    const normalizedInternalCode = String(form.internalCode || '').trim().toUpperCase();
    if (normalizedInternalCode && products.some(product => String(product.internalCode || '').toUpperCase() === normalizedInternalCode && product.id !== selected?.id)) {
      showToast('Este código interno já pertence a outro produto.', 'error');
      return;
    }
    if (normalizedBarcode && products.some(product => product.barcode === normalizedBarcode && product.id !== selected?.id)) {
      showToast('Este código de barras já pertence a outro produto.', 'error');
      barcodeRef.current?.focus();
      return;
    }
    const data = { ...form, internalCode: normalizedInternalCode, barcode: normalizedBarcode, unit: form.soldByWeight ? 'kg' : form.unit, stock: Number(form.stock) || 0 };
    if (modalType === 'new') {
      addProduct({ ...data, id: `PROD-${String(products.length + 1).padStart(3, '0')}` });
    } else if (modalType === 'edit') {
      updateProduct(selected.id, data);
    }
    setModalOpen(false);
    setSelected(null);
  };

  const handleDelete = () => {
    if (!selected) return;
    setModalType('confirmDelete');
    setModalOpen(true);
  };

  const confirmDelete = () => {
    deleteProduct(selected.id);
    setModalOpen(false);
    setSelected(null);
  };

  const handleInactivate = () => {
    if (!selected) return;
    inactivateProduct(selected.id);
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cadastro de Produtos</h1>
          <p className="text-sm text-gray-500">Produtos, categorias, preços e códigos de barras</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Novo produto
        </button>
        <button onClick={openConference} className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-100">
          <ScanBarcode className="w-4 h-4" /> Conferir produto
        </button>
        <button onClick={handleEdit} disabled={!selected} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <Edit className="w-4 h-4" /> Editar
        </button>
        <button onClick={handleInactivate} disabled={!selected} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <Power className="w-4 h-4" /> Inativar
        </button>
        <button onClick={handleDelete} disabled={!selected} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <Trash2 className="w-4 h-4" /> Arquivar
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
          >
            <option value="">Todas categorias</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
          >
            <option value="">Todos status</option>
            <option value="Ativo">Ativos</option>
            <option value="Inativo">Inativos</option>
          </select>
          <div className="flex items-end">
            <button onClick={() => { setSearch(''); setFilterCategory(''); setFilterStatus(''); }} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={setSelected}
        selectedId={selected?.id}
        emptyMessage="Nenhum produto encontrado"
      />

      <div className="text-sm text-gray-500">
        {filtered.length} produto{filtered.length !== 1 ? 's' : ''} localizado{filtered.length !== 1 ? 's' : ''}
      </div>

      <Modal isOpen={conferenceOpen} onClose={() => setConferenceOpen(false)} title="Conferência de produto">
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm"><ScanBarcode className="h-6 w-6" /></span><div><p className="font-semibold text-blue-950">Bipe o produto para conferir</p><p className="text-sm text-blue-700">Esta conferência não altera o cadastro nem o estoque.</p></div></div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Código de barras</label>
            <div className="flex gap-2">
              <input ref={conferenceRef} autoFocus inputMode="numeric" value={conferenceCode} onChange={event => { setConferenceCode(event.target.value.replace(/\D/g, '')); setConferenceResult(null); }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); checkRegisteredProduct(); } }} placeholder="Bipe ou digite o código" className="min-w-0 flex-1 rounded-lg border-2 border-blue-200 px-4 py-3 font-mono text-lg tracking-wider outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" />
              <button type="button" onClick={checkRegisteredProduct} disabled={!conferenceCode} className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300">Conferir</button>
            </div>
          </div>
          {conferenceResult?.found && <div className={`rounded-xl border p-5 ${conferenceResult.product.status === 'Ativo' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}><div className="flex items-start gap-3"><CheckCircle2 className={`mt-0.5 h-7 w-7 shrink-0 ${conferenceResult.product.status === 'Ativo' ? 'text-emerald-600' : 'text-amber-600'}`} /><div className="min-w-0"><p className={`text-lg font-bold ${conferenceResult.product.status === 'Ativo' ? 'text-emerald-800' : 'text-amber-800'}`}>{conferenceResult.product.status === 'Ativo' ? 'Produto já cadastrado' : 'Produto cadastrado, mas inativo'}</p><p className="mt-1 font-semibold text-gray-900">{conferenceResult.product.name}</p><div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-sm text-gray-600"><p>Código: <strong>{conferenceResult.product.id}</strong></p><p>Preço: <strong>R$ {Number(conferenceResult.product.price || 0).toFixed(2).replace('.', ',')}</strong></p><p>Categoria: <strong>{conferenceResult.product.category}</strong></p><p>Estoque: <strong>{conferenceResult.product.stock} {conferenceResult.product.soldByWeight ? 'kg' : conferenceResult.product.unit || 'un.'}</strong></p></div></div></div></div>}
          {conferenceResult && !conferenceResult.found && <div className="rounded-xl border border-red-200 bg-red-50 p-5"><div className="flex items-start gap-3"><X className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-red-600 p-1 text-white" /><div><p className="text-lg font-bold text-red-800">Produto ainda não cadastrado</p><p className="mt-1 text-sm text-red-700">Nenhum produto do sistema utiliza o código {conferenceResult.barcode}.</p><button type="button" onClick={registerConferenceProduct} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"><Plus className="h-4 w-4" /> Cadastrar este produto</button></div></div></div>}
          {conferenceResult && <button type="button" onClick={() => { setConferenceCode(''); setConferenceResult(null); setTimeout(() => conferenceRef.current?.focus(), 0); }} className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Conferir outro produto</button>}
        </div>
      </Modal>

      {/* Modal */}
      <Modal
        isOpen={modalOpen && modalType !== 'confirmDelete'}
        onClose={() => setModalOpen(false)}
        title={modalType === 'new' ? 'Novo Produto' : `Editar ${selected?.name || ''}`}
        onSave={handleSave}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"><ScanBarcode className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-sm font-semibold text-blue-900">Pegue o leitor e bipe o código de barras</p><p className="text-xs text-blue-700 mt-1">O número completo será preenchido automaticamente no campo abaixo. Você também pode digitá-lo.</p></div>
          </div>
          {modalType === 'edit' && (
            <FormField label="Código" value={form.id} disabled className="col-span-2" />
          )}
          <FormField label="Código interno da loja" value={form.internalCode || ''} onChange={(e) => setForm({ ...form, internalCode: e.target.value.toUpperCase() })} placeholder="Ex.: CARNE01" className="col-span-2" />
          <p className="col-span-2 -mt-2 text-xs text-gray-500">Use este código para produtos sem código de barras, como carnes, frutas e verduras. No caixa, basta digitá-lo e pressionar Enter.</p>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Código de barras / EAN</label>
            <div className="relative">
              <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input ref={barcodeRef} autoFocus inputMode="numeric" value={form.barcode || ''} onChange={(event) => { setForm({ ...form, barcode: event.target.value.replace(/\D/g, '') }); setLookupMessage(''); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); lookupBarcode(); } }} placeholder="Bipe agora ou digite todos os números" className="w-full pl-11 pr-12 py-2.5 border-2 border-blue-200 rounded-lg font-mono text-base tracking-wider outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              <button type="button" onClick={lookupBarcode} disabled={lookupBusy || !form.barcode} title="Identificar produto" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-emerald-600 disabled:text-gray-300">{lookupBusy ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}</button>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">EAN-13 normalmente tem 13 números. Os zeros iniciais serão preservados.</p>
            {lookupMessage && <p className={`text-xs mt-2 rounded-lg p-2.5 ${lookupMessage.startsWith('Produto identificado') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{lookupMessage}</p>}
            <p className="text-[11px] text-gray-400 mt-1">Dados sugeridos pela base colaborativa Open Food Facts; confirme antes de salvar.</p>
          </div>
          <FormField label="Descrição" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do produto" className="col-span-2" required />
          <FormField label="Categoria" type="select" value={form.category} onChange={(e) => { const category = e.target.value; const weighted = ['Açougue', 'Hortifruti'].includes(category); setForm({ ...form, category, ...(weighted ? { soldByWeight: true, unit: 'kg' } : {}) }); }} options={categories.map(c => ({ value: c, label: c }))} />
          <FormField label="Forma de venda" type="select" value={form.soldByWeight ? 'weight' : 'unit'} onChange={(e) => { const soldByWeight = e.target.value === 'weight'; setForm({ ...form, soldByWeight, unit: soldByWeight ? 'kg' : (form.unit === 'kg' ? 'Unidade' : form.unit) }); }} options={[{ value: 'unit', label: 'Por unidade' }, { value: 'weight', label: 'Por peso (kg)' }]} />
          <FormField label="Unidade" type="select" value={form.unit} disabled={form.soldByWeight} onChange={(e) => setForm({ ...form, unit: e.target.value, soldByWeight: e.target.value === 'kg' })} options={units.map(u => ({ value: u, label: u }))} />
          <FormField label={form.soldByWeight ? 'Preço de custo por kg (R$)' : 'Preço Custo (R$)'} type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="0.00" />
          <FormField label={form.soldByWeight ? 'Preço de venda por kg (R$)' : 'Preço Venda (R$)'} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
          <FormField label={form.soldByWeight ? 'Estoque atual (kg)' : 'Estoque Atual'} type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          {form.soldByWeight && <div className="col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><strong>Produto vendido por peso.</strong> Ao digitar o código deste produto no caixa, o sistema pedirá o peso em quilogramas e calculará o total automaticamente.</div>}
          <FormField label="Situação" type="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: 'Ativo', label: 'Ativo' }, { value: 'Inativo', label: 'Inativo' }]} />
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={modalOpen && modalType === 'confirmDelete'}
        onClose={() => setModalOpen(false)}
        title="Confirmar Arquivamento"
        onSave={confirmDelete}
        saveLabel="Arquivar"
        saveClass="bg-red-600 hover:bg-red-700"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-700">Deseja arquivar o produto <strong>{selected?.name}</strong>?</p>
          <p className="text-sm text-gray-500 mt-2">O registro será removido da listagem principal.</p>
        </div>
      </Modal>
    </div>
  );
}
