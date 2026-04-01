'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Empresa {
  id: string;
  nome_fantasia: string;
}

interface ChecklistItem {
  id: string;
  titulo: string;
}

interface Resposta {
  id: string;
  empresa: string;
  empresa_id: string | null;
  checklist: string;
  pergunta: string;
  resposta: string;
  resultado: string;
  responsavel: string;
  data: string;
  observacao: string;
}

interface Filtros {
  dataInicio: string;
  dataFim: string;
  empresa: string;
  questionario: string;
}

const CORES_CHECKLIST = ['#5E6AD2', '#4CAF50', '#FF9800', '#ef5350', '#9C27B0', '#00BCD4', '#FF5722', '#607D8B'];

export default function AnaliseQualidade() {
  const router = useRouter();
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [loadingFiltros, setLoadingFiltros] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [mostrarComparativo, setMostrarComparativo] = useState(false);
  const [loadingComp, setLoadingComp] = useState(false);
  const [respostasComp, setRespostasComp] = useState<Resposta[]>([]);
  const [filtrosComp, setFiltrosComp] = useState<Filtros>(() => {
    const hoje = new Date();
    const inicio = new Date();
    inicio.setDate(hoje.getDate() - 60);
    const fim = new Date();
    fim.setDate(hoje.getDate() - 31);
    const toISO = (d: Date) => d.toISOString().split('T')[0];
    return { dataInicio: toISO(inicio), dataFim: toISO(fim), empresa: '', questionario: '' };
  });

  const [filtros, setFiltros] = useState<Filtros>(() => {
    const hoje = new Date();
    const inicio = new Date();
    inicio.setDate(hoje.getDate() - 30);
    const toISO = (d: Date) => d.toISOString().split('T')[0];
    return { dataInicio: toISO(inicio), dataFim: toISO(hoje), empresa: '', questionario: '' };
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { router.push('/login'); return; }
    const user = JSON.parse(userData);
    if (user.role !== 'aluno') { router.push('/login'); return; }
    const id = user.id || user.aluno_id;
    setAlunoId(id);
    carregarFiltros(id);
  }, [router]);

  async function carregarFiltros(id: string) {
    setLoadingFiltros(true);
    try {
      const [empRes, clRes] = await Promise.all([
        fetch(`/api/aluno/empresas?aluno_id=${id}`),
        fetch(`/api/aluno/checklists-criados?aluno_id=${id}`)
      ]);
      const empData = await empRes.json();
      const clData = await clRes.json();
      setEmpresas(empData || []);
      setChecklists(clData.checklists || []);
    } finally {
      setLoadingFiltros(false);
    }
  }

  async function aplicarFiltros() {
    if (!alunoId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ aluno_id: alunoId });
      if (filtros.empresa) params.set('empresa_id', filtros.empresa);
      if (filtros.dataInicio) params.set('data_inicio', filtros.dataInicio);
      if (filtros.dataFim) params.set('data_fim', filtros.dataFim);

      const res = await fetch(`/api/aluno/respostas?${params}`);
      if (!res.ok) throw new Error('Erro ao carregar');
      const data = await res.json();

      let lista: Resposta[] = data.respostas || [];

      if (filtros.questionario) {
        const titulo = checklists.find(c => c.id === filtros.questionario)?.titulo;
        if (titulo) lista = lista.filter(r => r.checklist === titulo);
      }

      setRespostas(lista);
      setMostrarResultados(true);
    } finally {
      setLoading(false);
    }
  }

  function limparFiltros() {
    const hoje = new Date();
    const inicio = new Date();
    inicio.setDate(hoje.getDate() - 30);
    const toISO = (d: Date) => d.toISOString().split('T')[0];
    setFiltros({ dataInicio: toISO(inicio), dataFim: toISO(hoje), empresa: '', questionario: '' });
    setMostrarResultados(false);
    setRespostas([]);
  }

  async function buscarComparativo() {
    if (!alunoId) return;
    setLoadingComp(true);
    try {
      const params = new URLSearchParams({ aluno_id: alunoId });
      if (filtrosComp.empresa) params.set('empresa_id', filtrosComp.empresa);
      if (filtrosComp.dataInicio) params.set('data_inicio', filtrosComp.dataInicio);
      if (filtrosComp.dataFim) params.set('data_fim', filtrosComp.dataFim);
      const res = await fetch(`/api/aluno/respostas?${params}`);
      if (!res.ok) throw new Error('Erro ao carregar');
      const data = await res.json();
      setRespostasComp(data.respostas || []);
    } finally {
      setLoadingComp(false);
    }
  }

  function exportarCSV() {
    if (respostas.length === 0) return;
    const headers = ['Empresa', 'Checklist', 'Pergunta', 'Resposta', 'Resultado', 'Responsável', 'Data', 'Observação'];
    const rows = respostas.map(r => [r.empresa, r.checklist, r.pergunta, r.resposta, r.resultado, r.responsavel, r.data, r.observacao]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analise-qualidade.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Métricas calculadas
  const total = respostas.length;
  const conformes = respostas.filter(r => r.resultado === 'conforme').length;
  const naoConformes = respostas.filter(r => r.resultado === 'nao_conforme').length;
  const validas = conformes + naoConformes;
  const taxaConformidade = validas > 0 ? Math.round((conformes / validas) * 100) : 0;

  // Ranking por empresa
  const porEmpresa: Record<string, { nome: string; conforme: number; naoConforme: number }> = {};
  for (const r of respostas) {
    const key = r.empresa_id || r.empresa;
    if (!porEmpresa[key]) porEmpresa[key] = { nome: r.empresa, conforme: 0, naoConforme: 0 };
    if (r.resultado === 'conforme') porEmpresa[key].conforme++;
    else if (r.resultado === 'nao_conforme') porEmpresa[key].naoConforme++;
  }
  const rankingEmpresas = Object.values(porEmpresa)
    .map(e => {
      const tot = e.conforme + e.naoConforme;
      const taxa = tot > 0 ? Math.round((e.conforme / tot) * 100) : 0;
      return { ...e, taxa, total: tot };
    })
    .filter(e => e.total > 0)
    .sort((a, b) => b.taxa - a.taxa);

  // Análise por checklist
  const porChecklist: Record<string, { conforme: number; naoConforme: number }> = {};
  for (const r of respostas) {
    if (!porChecklist[r.checklist]) porChecklist[r.checklist] = { conforme: 0, naoConforme: 0 };
    if (r.resultado === 'conforme') porChecklist[r.checklist].conforme++;
    else if (r.resultado === 'nao_conforme') porChecklist[r.checklist].naoConforme++;
  }
  const checklistAnalise = Object.entries(porChecklist).map(([titulo, counts], i) => {
    const tot = counts.conforme + counts.naoConforme;
    const taxa = tot > 0 ? Math.round((counts.conforme / tot) * 100) : 0;
    return { titulo, ...counts, taxa, cor: CORES_CHECKLIST[i % CORES_CHECKLIST.length] };
  }).sort((a, b) => b.taxa - a.taxa);

  // Evolução por data
  const porData: Record<string, { conforme: number; total: number }> = {};
  for (const r of respostas) {
    const dataPart = r.data.split(' ')[0]; // "dd/MM/yyyy"
    if (!porData[dataPart]) porData[dataPart] = { conforme: 0, total: 0 };
    if (r.resultado === 'conforme' || r.resultado === 'nao_conforme') {
      porData[dataPart].total++;
      if (r.resultado === 'conforme') porData[dataPart].conforme++;
    }
  }
  const evolucao = Object.entries(porData)
    .sort(([a], [b]) => {
      const [da, ma, ya] = a.split('/').map(Number);
      const [db, mb, yb] = b.split('/').map(Number);
      return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
    })
    .map(([data, counts]) => ({
      dia: data.substring(0, 5),
      taxa: counts.total > 0 ? Math.round((counts.conforme / counts.total) * 100) : 0
    }))
    .slice(-14);

  // Métricas do período comparativo
  const totalComp = respostasComp.length;
  const conformesComp = respostasComp.filter(r => r.resultado === 'conforme').length;
  const naoConformesComp = respostasComp.filter(r => r.resultado === 'nao_conforme').length;
  const validasComp = conformesComp + naoConformesComp;
  const taxaComp = validasComp > 0 ? Math.round((conformesComp / validasComp) * 100) : 0;
  const delta = taxaConformidade - taxaComp;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #e3f2fd 100%)', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Botão Voltar */}
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white',
            border: '2px solid #e0e0e0', borderRadius: '0.75rem', padding: '0.75rem 1.25rem',
            fontSize: '0.875rem', fontWeight: '600', color: '#5E6AD2', cursor: 'pointer',
            marginBottom: '1.5rem', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.borderColor = '#5E6AD2'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e0e0e0'; }}
        >
          <span style={{ fontSize: '1.25rem' }}>←</span>
          <span>Voltar</span>
        </button>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.75rem', background: 'linear-gradient(135deg, #5E6AD2 0%, #4C52B2 100%)', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(94,106,210,0.3)' }}>
                <span style={{ fontSize: '1.5rem' }}>📊</span>
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>
                Análise de Qualidade
              </h1>
            </div>
            <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>
              Acompanhamento e análise de indicadores de desempenho
            </p>
          </div>

          <button
            onClick={exportarCSV}
            disabled={respostas.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: respostas.length === 0 ? '#ccc' : 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
              color: 'white', border: 'none', borderRadius: '0.75rem', padding: '0.875rem 1.5rem',
              fontSize: '0.875rem', fontWeight: '700', cursor: respostas.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: respostas.length === 0 ? 'none' : '0 4px 12px rgba(76,175,80,0.4)', transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '1rem' }}>📥</span>
            Exportar CSV
          </button>
        </div>

        {/* Card de Filtros */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>

            {/* Período */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1rem' }}>📅</span> Período de Análise
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'center' }}>
                <input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem' }}
                />
                <span style={{ color: '#999', fontWeight: '600' }}>→</span>
                <input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            {/* Empresa */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>🏢</span> Empresa
              </label>
              <select
                value={filtros.empresa}
                onChange={(e) => setFiltros({ ...filtros, empresa: e.target.value })}
                disabled={loadingFiltros}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem', cursor: 'pointer', background: 'white' }}
              >
                <option value="">{loadingFiltros ? 'Carregando...' : 'Todas as empresas'}</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome_fantasia}</option>
                ))}
              </select>
            </div>

            {/* Questionário */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>📋</span> Questionário
              </label>
              <select
                value={filtros.questionario}
                onChange={(e) => setFiltros({ ...filtros, questionario: e.target.value })}
                disabled={loadingFiltros}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem', cursor: 'pointer', background: 'white' }}
              >
                <option value="">{loadingFiltros ? 'Carregando...' : 'Todos os questionários'}</option>
                {checklists.map(cl => (
                  <option key={cl.id} value={cl.id}>{cl.titulo}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Botões de Ação */}
          <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '2px solid #f0f0f0' }}>
            <button
              onClick={aplicarFiltros}
              disabled={loading || loadingFiltros}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: (loading || loadingFiltros) ? '#ccc' : 'linear-gradient(135deg, #5E6AD2 0%, #4C52B2 100%)',
                color: 'white', border: 'none', borderRadius: '0.75rem', padding: '1rem',
                fontSize: '0.875rem', fontWeight: '700',
                cursor: (loading || loadingFiltros) ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(94,106,210,0.4)', transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '1rem' }}>{loading ? '⏳' : '✓'}</span>
              {loading ? 'Buscando...' : 'Aplicar Filtros'}
            </button>

            <button
              onClick={limparFiltros}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: 'white', color: '#666', border: '2px solid #e0e0e0', borderRadius: '0.75rem',
                padding: '1rem 2rem', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.borderColor = '#999'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e0e0e0'; }}
            >
              <span style={{ fontSize: '1rem' }}>🔄</span>
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Comparativo entre períodos */}
        {mostrarResultados && validas > 0 && (
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem 2rem', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '2px solid #e0e7ff' }}>
            <button
              onClick={() => setMostrarComparativo(!mostrarComparativo)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#5E6AD2', margin: 0 }}>
                🔀 Comparativo entre Períodos
              </h3>
              <span style={{ fontSize: '0.875rem', color: '#5E6AD2', fontWeight: '600' }}>
                {mostrarComparativo ? '▲ Fechar' : '▼ Abrir'}
              </span>
            </button>

            {mostrarComparativo && (
              <div style={{ marginTop: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                  Compare o período atual com outro período de referência.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#333', display: 'block', marginBottom: '0.375rem' }}>Início do período de referência</label>
                    <input type="date" value={filtrosComp.dataInicio} onChange={(e) => setFiltrosComp({ ...filtrosComp, dataInicio: e.target.value })}
                      style={{ width: '100%', padding: '0.625rem', border: '2px solid #e0e0e0', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#333', display: 'block', marginBottom: '0.375rem' }}>Fim do período de referência</label>
                    <input type="date" value={filtrosComp.dataFim} onChange={(e) => setFiltrosComp({ ...filtrosComp, dataFim: e.target.value })}
                      style={{ width: '100%', padding: '0.625rem', border: '2px solid #e0e0e0', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      onClick={buscarComparativo}
                      disabled={loadingComp}
                      style={{ width: '100%', padding: '0.625rem 1rem', background: loadingComp ? '#ccc' : '#5E6AD2', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: '700', cursor: loadingComp ? 'not-allowed' : 'pointer' }}
                    >
                      {loadingComp ? 'Buscando...' : 'Comparar'}
                    </button>
                  </div>
                </div>

                {validasComp > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
                    <div style={{ background: '#f1f5f9', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center' }}>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.375rem' }}>Período Atual</p>
                      <p style={{ fontSize: '2.5rem', fontWeight: '900', color: '#5E6AD2', margin: 0 }}>{taxaConformidade}%</p>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0' }}>{filtros.dataInicio} → {filtros.dataFim}</p>
                    </div>
                    <div style={{ background: '#f1f5f9', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center' }}>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.375rem' }}>Período de Referência</p>
                      <p style={{ fontSize: '2.5rem', fontWeight: '900', color: '#64748b', margin: 0 }}>{taxaComp}%</p>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0' }}>{filtrosComp.dataInicio} → {filtrosComp.dataFim}</p>
                    </div>
                    <div style={{ background: delta > 0 ? '#d1fae5' : delta < 0 ? '#fee2e2' : '#f3f4f6', borderRadius: '0.75rem', padding: '1.25rem', textAlign: 'center', border: `2px solid ${delta > 0 ? '#6ee7b7' : delta < 0 ? '#fca5a5' : '#e5e7eb'}` }}>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.375rem' }}>Variação</p>
                      <p style={{ fontSize: '2.5rem', fontWeight: '900', color: delta > 0 ? '#059669' : delta < 0 ? '#dc2626' : '#374151', margin: 0 }}>
                        {delta > 0 ? '+' : ''}{delta}%
                      </p>
                      <p style={{ fontSize: '0.8rem', fontWeight: '600', color: delta > 0 ? '#059669' : delta < 0 ? '#dc2626' : '#374151', margin: '0.25rem 0 0' }}>
                        {delta > 0 ? 'Melhora' : delta < 0 ? 'Queda' : 'Estável'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Resultados */}
        {mostrarResultados ? (
          total === 0 ? (
            <div style={{ background: 'white', borderRadius: '1rem', padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#333', marginBottom: '0.5rem' }}>
                Nenhuma resposta encontrada
              </h3>
              <p style={{ color: '#666', fontSize: '1rem' }}>
                Tente ajustar o período ou os filtros selecionados.
              </p>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #5E6AD2 0%, #4C52B2 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white', boxShadow: '0 4px 12px rgba(94,106,210,0.3)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                  <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: '0 0 0.5rem 0' }}>Taxa de Conformidade</p>
                  <p style={{ fontSize: '3rem', fontWeight: '900', margin: 0 }}>{taxaConformidade}%</p>
                </div>

                <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                  <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 0.5rem 0' }}>Total de Respostas</p>
                  <p style={{ fontSize: '2.5rem', fontWeight: '900', color: '#333', margin: 0 }}>{total}</p>
                </div>

                <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
                  <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 0.5rem 0' }}>Conformes</p>
                  <p style={{ fontSize: '2.5rem', fontWeight: '900', color: '#4CAF50', margin: 0 }}>{conformes}</p>
                </div>

                <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✗</div>
                  <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 0.5rem 0' }}>Não Conformes</p>
                  <p style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ef5350', margin: 0 }}>{naoConformes}</p>
                </div>
              </div>

              {/* Ranking de Lojas/Empresas */}
              {rankingEmpresas.length > 1 && (
                <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333', marginBottom: '1.5rem' }}>
                    🏆 Ranking de Lojas
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {rankingEmpresas.map((emp, idx) => {
                      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`
                      const cor = emp.taxa >= 85 ? '#4CAF50' : emp.taxa >= 70 ? '#FF9800' : '#ef5350'
                      const isLast = idx === rankingEmpresas.length - 1 && rankingEmpresas.length > 3
                      return (
                        <div key={emp.nome} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', borderRadius: '0.75rem', backgroundColor: idx === 0 ? '#fffbeb' : '#f9fafb', border: idx === 0 ? '1.5px solid #fcd34d' : '1.5px solid #e5e7eb' }}>
                          <span style={{ fontSize: idx < 3 ? '1.5rem' : '1rem', fontWeight: '700', color: '#6b7280', minWidth: '2rem', textAlign: 'center' }}>{medal}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: '700', color: '#1f2937', fontSize: '0.95rem' }}>{emp.nome}</p>
                            <p style={{ margin: '0.125rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>{emp.conforme} conformes / {emp.naoConforme} não conformes ({emp.total} respostas)</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '100px', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{ width: `${emp.taxa}%`, height: '100%', backgroundColor: cor, borderRadius: '999px' }} />
                            </div>
                            <span style={{ fontSize: '1.25rem', fontWeight: '900', color: cor, minWidth: '3rem', textAlign: 'right' }}>{emp.taxa}%</span>
                            {isLast && <span style={{ fontSize: '0.75rem', color: '#ef5350', fontWeight: '600' }}>↓ Atenção</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Gráfico de Pizza — Conformidade */}
              {validas > 0 && (() => {
                const r = 70, cx = 90, cy = 90
                const conf = (conformes / validas) * 2 * Math.PI
                const nConf = (naoConformes / validas) * 2 * Math.PI
                function arc(startAngle: number, endAngle: number, color: string) {
                  const x1 = cx + r * Math.cos(startAngle - Math.PI / 2)
                  const y1 = cy + r * Math.sin(startAngle - Math.PI / 2)
                  const x2 = cx + r * Math.cos(endAngle - Math.PI / 2)
                  const y2 = cy + r * Math.sin(endAngle - Math.PI / 2)
                  const large = endAngle - startAngle > Math.PI ? 1 : 0
                  return <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`} fill={color} />
                }
                return (
                  <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333', width: '100%', marginBottom: '0.5rem' }}>🥧 Distribuição de Respostas</h3>
                    <svg viewBox="0 0 180 180" style={{ width: '180px', height: '180px', flexShrink: 0 }}>
                      {arc(0, conf, '#4CAF50')}
                      {arc(conf, conf + nConf, '#ef5350')}
                      <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
                      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="900" fill="#5E6AD2">{taxaConformidade}%</text>
                      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#9ca3af">conformidade</text>
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#4CAF50' }} />
                        <span style={{ fontSize: '0.95rem', color: '#333' }}><strong>{conformes}</strong> conformes ({validas > 0 ? Math.round(conformes/validas*100) : 0}%)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#ef5350' }} />
                        <span style={{ fontSize: '0.95rem', color: '#333' }}><strong>{naoConformes}</strong> não conformes ({validas > 0 ? Math.round(naoConformes/validas*100) : 0}%)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#e0e0e0' }} />
                        <span style={{ fontSize: '0.95rem', color: '#333' }}><strong>{total - validas}</strong> N/A ou sem resposta</span>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Análise por Checklist */}
              {checklistAnalise.length > 0 && (
                <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333', marginBottom: '1.5rem' }}>
                    📋 Análise por Checklist
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {checklistAnalise.map((item) => (
                      <div key={item.titulo}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: item.cor, flexShrink: 0 }} />
                            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.titulo}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#666', flexShrink: 0 }}>
                              ({item.conforme + item.naoConforme} resp.)
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.875rem', color: '#4CAF50', fontWeight: '600' }}>✓ {item.conforme}</span>
                            <span style={{ fontSize: '0.875rem', color: '#ef5350', fontWeight: '600' }}>✗ {item.naoConforme}</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: '900', color: item.cor, minWidth: '60px', textAlign: 'right' }}>
                              {item.taxa}%
                            </span>
                          </div>
                        </div>
                        <div style={{ width: '100%', height: '20px', background: '#f0f0f0', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ width: `${item.taxa}%`, height: '100%', background: item.cor, borderRadius: '10px', transition: 'width 1s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evolução por Data — linha SVG */}
              {evolucao.length > 1 && (() => {
                const W = 800, H = 220, padL = 40, padR = 20, padT = 20, padB = 40
                const innerW = W - padL - padR, innerH = H - padT - padB
                const maxTaxa = 100
                const pts = evolucao.map((d, i) => ({
                  x: padL + (i / (evolucao.length - 1)) * innerW,
                  y: padT + innerH - (d.taxa / maxTaxa) * innerH,
                  taxa: d.taxa,
                  dia: d.dia,
                }))
                const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
                const area = `${padL},${padT + innerH} ` + pts.map(p => `${p.x},${p.y}`).join(' ') + ` ${padL + innerW},${padT + innerH}`
                const tendencia = evolucao.length >= 2 ? evolucao[evolucao.length - 1].taxa - evolucao[0].taxa : 0
                return (
                  <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333', margin: 0 }}>
                        📈 Evolução da Taxa de Conformidade
                      </h3>
                      <span style={{ padding: '0.375rem 1rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: '700', backgroundColor: tendencia > 0 ? '#d1fae5' : tendencia < 0 ? '#fee2e2' : '#f3f4f6', color: tendencia > 0 ? '#065f46' : tendencia < 0 ? '#991b1b' : '#374151' }}>
                        {tendencia > 0 ? '↑' : tendencia < 0 ? '↓' : '→'} {tendencia > 0 ? '+' : ''}{tendencia}% no período
                      </span>
                    </div>
                    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#5E6AD2" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#5E6AD2" stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      {/* Grade horizontal */}
                      {[0, 25, 50, 75, 100].map(v => {
                        const y = padT + innerH - (v / 100) * innerH
                        return (
                          <g key={v}>
                            <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{v}%</text>
                          </g>
                        )
                      })}
                      {/* Área preenchida */}
                      <polygon points={area} fill="url(#areaGrad)" />
                      {/* Linha */}
                      <polyline points={polyline} fill="none" stroke="#5E6AD2" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                      {/* Pontos */}
                      {pts.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="5" fill="white" stroke="#5E6AD2" strokeWidth="2.5" />
                          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="10" fontWeight="700" fill="#5E6AD2">{p.taxa}%</text>
                          <text x={p.x} y={padT + innerH + 16} textAnchor="middle" fontSize="10" fill="#6b7280">{p.dia}</text>
                        </g>
                      ))}
                    </svg>
                  </div>
                )
              })()}
            </>
          )
        ) : (
          <div style={{ background: 'white', borderRadius: '1rem', padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <div style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div style={{
                width: '120px', height: '120px',
                background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 2rem', border: '4px solid #90CAF9'
              }}>
                <span style={{ fontSize: '4rem' }}>📊</span>
              </div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#333', marginBottom: '1rem' }}>
                Configure os Filtros de Análise
              </h3>
              <p style={{ color: '#666', fontSize: '1rem', margin: 0, lineHeight: 1.6 }}>
                Selecione o período e empresa para visualizar os indicadores de qualidade e desempenho.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
