'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
interface Empresa { id: string; nome_fantasia: string }
interface Checklist { id: string; titulo: string }
interface Item { id: string; titulo: string; ordem: number }

export default function CriarAcao() {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [itens, setItens] = useState<Item[]>([]);

  const [carregandoChecklists, setCarregandoChecklists] = useState(false);
  const [carregandoItens, setCarregandoItens] = useState(false);

  const [formulario, setFormulario] = useState({
    urgente: false,
    empresa_id: '',
    checklist_id: '',
    item_id: '',
    titulo: '',
    descricao: '',
    responsavel: '',
    prazo: '',
    prioridade: 'media',
    status: 'aguardando',
    categoria: '',
    orcamento: '',
    valorPago: '',
    observacoes: ''
  });

  useEffect(() => {
    carregarEmpresas();
  }, []);

  async function carregarEmpresas() {
    const userStr = localStorage.getItem('user');
    if (!userStr) { router.push('/login'); return; }
    const user = JSON.parse(userStr);
    if (user.role !== 'aluno') { router.push('/login'); return; }

    const res = await fetch(`/api/aluno/empresas?aluno_id=${user.id}`);
    const data = res.ok ? await res.json() : [];
    const ativas = data.filter((e: Empresa) => e.ativo !== false);
    setEmpresas(ativas);
    if (ativas.length === 1) {
      setFormulario(prev => ({ ...prev, empresa_id: ativas[0].id }));
      await carregarChecklists(ativas[0].id);
    }
  }

  async function carregarChecklists(empresaId: string) {
    if (!empresaId) {
      setChecklists([]); setItens([]);
      setFormulario(prev => ({ ...prev, checklist_id: '', item_id: '' }));
      return;
    }
    setCarregandoChecklists(true);
    const res = await fetch(`/api/aluno/checklists-futuros?empresa_id=${empresaId}`);
    const data = res.ok ? await res.json() : [];
    setChecklists(data);
    setItens([]);
    setFormulario(prev => ({ ...prev, checklist_id: '', item_id: '' }));
    setCarregandoChecklists(false);
  }

  async function carregarItens(checklistId: string) {
    if (!checklistId) {
      setItens([]); setFormulario(prev => ({ ...prev, item_id: '' }));
      return;
    }
    setCarregandoItens(true);
    const res = await fetch(`/api/aluno/checklists-futuros?checklist_id=${checklistId}`);
    const data = res.ok ? await res.json() : [];
    setItens(data);
    setFormulario(prev => ({ ...prev, item_id: '' }));
    setCarregandoItens(false);
  }

  function handleChange(field: string, value: string | boolean) {
    setFormulario(prev => ({ ...prev, [field]: value }));
  }

  async function handleEmpresaChange(empresaId: string) {
    setFormulario(prev => ({ ...prev, empresa_id: empresaId, checklist_id: '', item_id: '' }));
    await carregarChecklists(empresaId);
  }

  async function handleChecklistChange(checklistId: string) {
    setFormulario(prev => ({ ...prev, checklist_id: checklistId, item_id: '' }));
    await carregarItens(checklistId);
  }

  function handleItemChange(itemId: string) {
    const item = itens.find(i => i.id === itemId);
    setFormulario(prev => ({
      ...prev,
      item_id: itemId,
      // Pré-preenche o título se ainda estiver vazio
      titulo: prev.titulo.trim() === '' && item ? item.titulo : prev.titulo
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formulario.titulo.trim()) { alert('Informe o título da ação.'); return; }
    if (!formulario.empresa_id) { alert('Selecione a empresa.'); return; }

    setSalvando(true);
    try {
      const res = await fetch('/api/aluno/acoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_id: formulario.empresa_id,
          checklist_id: formulario.checklist_id || null,
          item_id: formulario.item_id || null,
          titulo: formulario.titulo.trim(),
          descricao: formulario.descricao.trim() || null,
          responsavel: formulario.responsavel.trim() || null,
          prazo: formulario.prazo || null,
          prioridade: formulario.prioridade,
          status: formulario.status,
          categoria: formulario.categoria.trim() || null,
          orcamento: formulario.orcamento ? parseFloat(formulario.orcamento.replace(',', '.')) : null,
          valor_pago: formulario.valorPago ? parseFloat(formulario.valorPago.replace(',', '.')) : null,
          observacoes: formulario.observacoes.trim() || null,
          urgente: formulario.urgente
        })
      });
      if (!res.ok) throw new Error('Erro ao criar ação');
      alert('Ação criada com sucesso!');
      router.push('/acoes');
    } catch (err) {
      console.error('Erro ao criar ação:', err);
      alert('Erro ao criar ação. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #e0e0e0',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontFamily: 'inherit'
  };

  const labelStyle = {
    display: 'block' as const,
    fontSize: '0.875rem',
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: '0.5rem'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', padding: '2rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>

          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#333', margin: '0 0 0.5rem 0' }}>Criando</h1>
            <p style={{ fontSize: '1.25rem', color: '#666', margin: 0 }}>Tarefa (Ação)</p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Urgente */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formulario.urgente}
                  onChange={(e) => handleChange('urgente', e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333' }}>Urgente?</span>
              </label>
            </div>

            {/* Empresa */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Empresa *</label>
              <select
                value={formulario.empresa_id}
                onChange={(e) => handleEmpresaChange(e.target.value)}
                required
                style={inputStyle}
              >
                <option value="">Selecione a empresa</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome_fantasia}</option>
                ))}
              </select>
            </div>

            {/* Vínculo com Checklist — aparece após selecionar empresa */}
            {formulario.empresa_id && (
              <div style={{
                background: '#f0f7ff',
                border: '2px solid #bbdefb',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '700', color: '#1565C0', margin: '0 0 1rem 0' }}>
                  📋 Vincular a um checklist (opcional)
                </p>

                {/* Checklist */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ ...labelStyle, color: '#1565C0' }}>Checklist</label>
                  <select
                    value={formulario.checklist_id}
                    onChange={(e) => handleChecklistChange(e.target.value)}
                    disabled={carregandoChecklists}
                    style={{ ...inputStyle, border: '2px solid #bbdefb', background: 'white' }}
                  >
                    <option value="">
                      {carregandoChecklists ? 'Carregando...' : checklists.length === 0 ? 'Nenhum checklist disponível' : 'Selecione o checklist (opcional)'}
                    </option>
                    {checklists.map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.titulo}</option>
                    ))}
                  </select>
                </div>

                {/* Item — aparece após selecionar checklist */}
                {formulario.checklist_id && (
                  <div>
                    <label style={{ ...labelStyle, color: '#1565C0' }}>Item do checklist</label>
                    <select
                      value={formulario.item_id}
                      onChange={(e) => handleItemChange(e.target.value)}
                      disabled={carregandoItens}
                      style={{ ...inputStyle, border: '2px solid #bbdefb', background: 'white' }}
                    >
                      <option value="">
                        {carregandoItens ? 'Carregando...' : itens.length === 0 ? 'Nenhum item disponível' : 'Selecione o item (opcional)'}
                      </option>
                      {itens.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.ordem}. {item.titulo}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Título */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Título *</label>
              <input
                type="text"
                value={formulario.titulo}
                onChange={(e) => handleChange('titulo', e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            {/* Descrição */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Descrição</label>
              <input
                type="text"
                value={formulario.descricao}
                onChange={(e) => handleChange('descricao', e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Responsável */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Responsável</label>
              <input
                type="text"
                value={formulario.responsavel}
                onChange={(e) => handleChange('responsavel', e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Prioridade e Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Prioridade</label>
                <select value={formulario.prioridade} onChange={(e) => handleChange('prioridade', e.target.value)} style={inputStyle}>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={formulario.status} onChange={(e) => handleChange('status', e.target.value)} style={inputStyle}>
                  <option value="aguardando">Aguardando</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluida">Concluída</option>
                  <option value="atrasada">Atrasada</option>
                </select>
              </div>
            </div>

            {/* Categoria e Prazo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Categoria</label>
                <input
                  type="text"
                  value={formulario.categoria}
                  onChange={(e) => handleChange('categoria', e.target.value)}
                  placeholder="Ex: Segurança, Limpeza..."
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Prazo</label>
                <input
                  type="date"
                  value={formulario.prazo}
                  onChange={(e) => handleChange('prazo', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Orçamento e Valor Pago */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Orçamento</label>
                <input
                  type="text"
                  value={formulario.orcamento}
                  onChange={(e) => handleChange('orcamento', e.target.value)}
                  placeholder="R$ 0,00"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Valor pago</label>
                <input
                  type="text"
                  value={formulario.valorPago}
                  onChange={(e) => handleChange('valorPago', e.target.value)}
                  placeholder="R$ 0,00"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Observações */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={labelStyle}>Observações</label>
              <textarea
                value={formulario.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => router.push('/acoes')}
                style={{ background: 'transparent', border: 'none', color: '#2196F3', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Voltar à lista
              </button>
              <button
                type="submit"
                disabled={salvando}
                style={{
                  background: salvando ? '#90CAF9' : 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                  color: 'white', border: 'none', padding: '0.875rem 2.5rem',
                  borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '700',
                  cursor: salvando ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(33,150,243,0.4)', transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { if (!salvando) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {salvando ? 'Salvando...' : 'Criar'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
