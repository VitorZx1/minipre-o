import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import { Plus, ShoppingCart, FileText, Eye, X, Upload, MessageSquare, Calendar, ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';
import { seedSuppliers, categories } from '../data/seed';

export default function Compras() {
  const { compras, addCompra, updateCompra, deleteCompra, addObservacao, user } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ total: '', dateFechamento: '', status: '' });
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [expandedCompra, setExpandedCompra] = useState(null);
  const [newObsText, setNewObsText] = useState('');
  const [newObsAttachment, setNewObsAttachment] = useState('');
  const [newObsAttachmentName, setNewObsAttachmentName] = useState('');
  const [form, setForm] = useState({
    date: new Date().toLocaleDateString('pt-BR'),
    supplier: '',
    category: '',
    total: '',
  });
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentData, setAttachmentData] = useState('');
  const fileInputRef = useRef(null);
  const obsFileInputRef = useRef(null);

  const getStatusColor = (status) => {
    const colors = {
      'Pendente': 'bg-amber-100 text-amber-700 border-amber-200',
      'Em andamento': 'bg-blue-100 text-blue-700 border-blue-200',
      'Concluído': 'bg-green-100 text-green-700 border-green-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const handleFileSelect = (e, isObs = false) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (isObs) {
        setNewObsAttachmentName(file.name);
        setNewObsAttachment(ev.target.result);
      } else {
        setAttachmentName(file.name);
        setAttachmentData(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const generateDescription = (supplier, category, date) => {
    if (!supplier || !category) return '';
    return `Pedido feito com ${supplier} no dia ${date}`;
  };

  const parseCurrency = (str) => {
    if (!str) return 0;
    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
  };

  const formatCurrency = (num) => {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSave = () => {
    const description = generateDescription(form.supplier, form.category, form.date);
    const compraData = {
      date: form.date,
      dateFechamento: '',
      supplier: form.supplier,
      description: description,
      total: parseCurrency(form.total),
      totalReal: null,
      status: 'Pendente',
      observacoes: [{
        text: description,
        user: 'Sistema',
        attachment: attachmentData || null,
        attachmentName: attachmentName || null,
        createdAt: form.date,
      }],
    };
    addCompra(compraData);
    setModalOpen(false);
    resetForm();
  };

  const handleAddObservacao = () => {
    if (!selectedCompra || !newObsText.trim()) return;

    const obs = {
      text: newObsText,
      user: user?.name || 'ADMINISTRADOR',
      attachment: newObsAttachment || null,
      attachmentName: newObsAttachmentName || null,
      createdAt: new Date().toLocaleDateString('pt-BR'),
    };

    addObservacao(selectedCompra.id, obs);

    // Se a observação é de entrega/nota, atualizar status e data de fechamento
    if (newObsText.toLowerCase().includes('entregue') || newObsText.toLowerCase().includes('nota lançada')) {
      updateCompra(selectedCompra.id, {
        status: 'Concluído',
        dateFechamento: new Date().toLocaleDateString('pt-BR'),
      });
    }

    setObsModalOpen(false);
    setSelectedCompra(null);
    resetObsForm();
  };

  const resetForm = () => {
    setForm({
      date: new Date().toLocaleDateString('pt-BR'),
      supplier: '',
      category: '',
      total: '',
    });
    setAttachmentName('');
    setAttachmentData('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetObsForm = () => {
    setNewObsText('');
    setNewObsAttachment('');
    setNewObsAttachmentName('');
    if (obsFileInputRef.current) obsFileInputRef.current.value = '';
  };

  const openObsModal = (compra) => {
    setSelectedCompra(compra);
    resetObsForm();
    setObsModalOpen(true);
  };

  const openViewModal = (compra) => {
    setSelectedCompra(compra);
    setViewModalOpen(true);
  };

  const openEditModal = (compra) => {
    setSelectedCompra(compra);
    setEditForm({
      total: compra.totalReal != null ? formatCurrency(compra.totalReal) : '',
      dateFechamento: compra.dateFechamento || '',
      status: compra.status,
    });
    setAttachmentName(compra.attachmentName || '');
    setAttachmentData(compra.attachment || '');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setEditModalOpen(true);
  };

  const handleDelete = () => {
    if (!selectedCompra) return;
    deleteCompra(selectedCompra.id);
    setDeleteModalOpen(false);
    setSelectedCompra(null);
  };

  const handleEditSave = () => {
    if (!selectedCompra) return;

    // Verificar se pode marcar como Concluído
    const hasAttachment = attachmentData || selectedCompra.attachment;
    if (editForm.status === 'Concluído' && !hasAttachment) {
      alert('Não é possível marcar como Concluído sem anexar a nota fiscal.');
      return;
    }

    const updates = {
      totalReal: parseCurrency(editForm.total) || null,
      status: editForm.status,
    };
    if (editForm.dateFechamento) {
      updates.dateFechamento = editForm.dateFechamento;
    }
    if (attachmentData && attachmentData !== selectedCompra.attachment) {
      updates.attachment = attachmentData;
      updates.attachmentName = attachmentName;
    }
    updateCompra(selectedCompra.id, updates);
    setEditModalOpen(false);
    setSelectedCompra(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingCart className="w-6 h-6 text-gray-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pedidos de Compra</h1>
          <p className="text-sm text-gray-500">Pedidos, cotações e recebimentos de mercadoria</p>
        </div>
      </div>

      <button onClick={() => {
        setForm({
          date: new Date().toLocaleDateString('pt-BR'),
          supplier: '',
          category: '',
          total: '',
        });
        setAttachmentName('');
        setAttachmentData('');
        setModalOpen(true);
      }} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm">
        <Plus className="w-4 h-4" /> Novo pedido
      </button>

      {/* Lista de Pedidos */}
      <div className="space-y-3">
        {compras.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            Nenhum pedido de compra encontrado
          </div>
        )}

        {compras.map((compra) => (
          <div key={compra.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header do Pedido */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{compra.id}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(compra.status)}`}>
                      {compra.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{compra.supplier}</p>
                  <p className="text-xs text-gray-500 mt-1">{compra.description}</p>
                </div>
                <div className="text-right">
                  {compra.totalReal != null && compra.totalReal !== 0 ? (
                    <>
                      <p className="text-xs text-gray-500">Previsto: R$ {compra.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-lg font-bold text-gray-800">Pago: R$ {compra.totalReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      {compra.totalReal !== compra.total && (
                        <p className={`text-xs font-semibold ${compra.totalReal > compra.total ? 'text-red-600' : 'text-green-600'}`}>
                          {compra.totalReal > compra.total ? '+' : ''}R$ {(compra.totalReal - compra.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-lg font-bold text-gray-800">R$ {compra.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Abertura: {compra.date}</p>
                  {compra.dateFechamento && (
                    <p className="text-xs text-green-600 mt-0.5">Fechamento: {compra.dateFechamento}</p>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => openEditModal(compra)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => { setSelectedCompra(compra); setDeleteModalOpen(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </button>
                {compra.status === 'Concluído' && compra.attachment && (
                  <a
                    href={compra.attachment}
                    download={compra.attachmentName || 'nota-fiscal'}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Baixar Nota
                  </a>
                )}
                <button
                  onClick={() => openObsModal(compra)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Adicionar observação
                </button>
                <button
                  onClick={() => openViewModal(compra)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver detalhes
                </button>
                <button
                  onClick={() => setExpandedCompra(expandedCompra === compra.id ? null : compra.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors ml-auto"
                >
                  {expandedCompra === compra.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  Observações ({compra.observacoes?.length || 0})
                </button>
              </div>
            </div>

            {/* Observações expandidas */}
            {expandedCompra === compra.id && compra.observacoes && compra.observacoes.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50 p-4">
                <div className="space-y-3">
                  {compra.observacoes.map((obs, i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{obs.text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-400">{obs.createdAt}</p>
                            <span className="text-xs text-gray-500">—</span>
                            <span className={`text-xs font-medium ${obs.user === 'Sistema' ? 'text-blue-500' : 'text-gray-600'}`}>{obs.user === 'Sistema' ? 'Sistema' : obs.user || 'ADMINISTRADOR'}</span>
                          </div>
                          {obs.attachment && (
                            <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                              <FileText className="w-4 h-4 text-green-600" />
                              <span className="text-xs text-green-700 truncate">{obs.attachmentName}</span>
                              <a href={obs.attachment} download={obs.attachmentName} className="text-blue-600 hover:text-blue-800">
                                <Eye className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Novo Pedido */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title="Novo Pedido de Compra" onSave={handleSave}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Data da Abertura" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <FormField label="Fornecedor" type="select" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} options={[{ value: '', label: 'Selecione...' }, ...seedSuppliers.map(s => ({ value: s.name, label: s.name }))]} />
          <FormField label="Categoria" type="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={[{ value: '', label: 'Selecione...' }, ...categories.map(c => ({ value: c, label: c }))]} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor Esperado</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
              <input
                type="text"
                inputMode="decimal"
                value={form.total}
                onChange={(e) => {
                  let v = e.target.value.replace(/[^\d]/g, '');
                  if (v === '') { setForm({ ...form, total: '' }); return; }
                  v = v.replace(/^0+/, '');
                  while (v.length < 3) v = '0' + v;
                  const intPart = v.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                  const decPart = v.slice(-2);
                  setForm({ ...form, total: intPart + ',' + decPart });
                }}
                placeholder="0,00"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>
          </div>

          {/* Pré-visualização da descrição */}
          {form.supplier && form.category && (
            <div className="col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">Descrição automática:</p>
              <p className="text-sm text-blue-800">{generateDescription(form.supplier, form.category, form.date)}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Adicionar Observação */}
      <Modal isOpen={obsModalOpen} onClose={() => { setObsModalOpen(false); setSelectedCompra(null); resetObsForm(); }} title={`Observação - ${selectedCompra?.id || ''}`} onSave={handleAddObservacao} saveLabel="Adicionar">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Observação</label>
            <textarea
              value={newObsText}
              onChange={(e) => setNewObsText(e.target.value)}
              placeholder="Ex: Produtos entregues na mercearia, conferido, e nota lançada"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Anexo (opcional)</label>
            {newObsAttachmentName ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700 flex-1 truncate">{newObsAttachmentName}</span>
                <button onClick={() => { setNewObsAttachment(''); setNewObsAttachmentName(''); }} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => obsFileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-red-400 hover:text-red-500 transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span className="text-sm">Anexar arquivo</span>
              </button>
            )}
            <input ref={obsFileInputRef} type="file" accept="image/*,.pdf" onChange={(e) => handleFileSelect(e, true)} className="hidden" />
          </div>

          {/* Dica */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700">
              <strong>Dica:</strong> Se você digitar "Produtos entregues na mercearia, conferido, e nota lançada", o pedido será marcado como Concluído automaticamente.
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal Detalhes do Pedido */}
      <Modal isOpen={viewModalOpen} onClose={() => { setViewModalOpen(false); setSelectedCompra(null); }} title={`Detalhes - ${selectedCompra?.id || ''}`}>
        {selectedCompra && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Fornecedor:</span>
                <p className="font-medium text-gray-800">{selectedCompra.supplier}</p>
              </div>
              <div>
                <span className="text-gray-500">Situação:</span>
                <p className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(selectedCompra.status)}`}>{selectedCompra.status}</p>
              </div>
              <div>
                <span className="text-gray-500">Data de Abertura:</span>
                <p className="font-medium text-gray-800">{selectedCompra.date}</p>
              </div>
              <div>
                <span className="text-gray-500">Data de Fechamento:</span>
                <p className="font-medium text-gray-800">{selectedCompra.dateFechamento || '—'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Descrição:</span>
                <p className="font-medium text-gray-800">{selectedCompra.description}</p>
              </div>
              <div>
                <span className="text-gray-500">Valor Total:</span>
                <p className="font-bold text-gray-800">R$ {selectedCompra.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            {/* Observações */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Histórico de Observações</h4>
              {selectedCompra.observacoes && selectedCompra.observacoes.length > 0 ? (
                <div className="space-y-2">
                  {selectedCompra.observacoes.map((obs, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{obs.text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-400">{obs.createdAt}</p>
                            <span className="text-xs text-gray-500">—</span>
                            <span className={`text-xs font-medium ${obs.user === 'Sistema' ? 'text-blue-500' : 'text-gray-600'}`}>{obs.user === 'Sistema' ? 'Sistema' : obs.user || 'ADMINISTRADOR'}</span>
                          </div>
                          {obs.attachment && (
                            <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                              <FileText className="w-4 h-4 text-green-600" />
                              <span className="text-xs text-green-700 truncate">{obs.attachmentName}</span>
                              <a href={obs.attachment} download={obs.attachmentName} className="text-blue-600 hover:text-blue-800">
                                <Eye className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Nenhuma observação registrada</p>
              )}
            </div>

            {/* Botão para adicionar observação */}
            <button
              onClick={() => { setViewModalOpen(false); openObsModal(selectedCompra); }}
              className="w-full flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
            >
              <MessageSquare className="w-4 h-4" />
              Adicionar nova observação
            </button>
          </div>
        )}
      </Modal>
      {/* Modal Editar Pedido */}
      <Modal isOpen={editModalOpen} onClose={() => { setEditModalOpen(false); setSelectedCompra(null); }} title={`Editar - ${selectedCompra?.id || ''}`} onSave={handleEditSave} saveLabel="Salvar">
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-500">Fornecedor</p>
            <p className="text-sm font-bold text-gray-800">{selectedCompra?.supplier || '—'}</p>
            <div className="mt-2">
              <p className="text-xs text-gray-500">Descrição</p>
              <p className="text-sm text-gray-700">{selectedCompra?.description || '—'}</p>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-600">Valor Esperado:</p>
            <p className="text-sm font-bold text-amber-800">R$ {selectedCompra?.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor Pago (Real)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
              <input
                type="text"
                inputMode="decimal"
                value={editForm.total}
                onChange={(e) => {
                  let v = e.target.value.replace(/[^\d]/g, '');
                  if (v === '') { setEditForm({ ...editForm, total: '' }); return; }
                  v = v.replace(/^0+/, '');
                  while (v.length < 3) v = '0' + v;
                  const intPart = v.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                  const decPart = v.slice(-2);
                  setEditForm({ ...editForm, total: intPart + ',' + decPart });
                }}
                placeholder="0,00"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Data de Fechamento (quando chegou)</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={editForm.dateFechamento}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, '');
                if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5, 9);
                setEditForm({ ...editForm, dateFechamento: v });
              }}
              placeholder="dd/mm/aaaa"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>

          <FormField
            label="Situação"
            type="select"
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            options={['Pendente', 'Em andamento', 'Concluído'].map(s => ({ value: s, label: s }))}
          />

          {/* Nota Fiscal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nota Fiscal</label>
            {attachmentName ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700 flex-1 truncate">{attachmentName}</span>
                <button onClick={() => { setAttachmentName(''); setAttachmentData(''); }} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-red-400 hover:text-red-500 transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span className="text-sm">Clique para anexar a nota fiscal</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={(e) => handleFileSelect(e, false)} className="hidden" />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Dica:</strong> Preencha a data de fechamento quando os produtos realmente chegarem na mercearia e anexe a nota fiscal.
            </p>
          </div>
        </div>
      </Modal>
      {/* Modal Confirmar Exclusão */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setSelectedCompra(null); }}
        title="Confirmar Exclusão"
        onSave={handleDelete}
        saveLabel="Excluir"
        saveClass="bg-red-600 hover:bg-red-700"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-700">Deseja excluir o pedido <strong>{selectedCompra?.id}</strong>?</p>
          <p className="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>
        </div>
      </Modal>
    </div>
  );
}
