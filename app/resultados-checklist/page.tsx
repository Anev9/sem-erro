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

              {/* Evolução por Data */}
              {evolucao.length > 1 && (
                <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333', marginBottom: '1.5rem' }}>
                    📈 Evolução da Taxa de Conformidade
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '250px', gap: '0.5rem' }}>
                    {evolucao.map((dado) => {
                      const altura = Math.max((dado.taxa / 100) * 200, 4);
                      const cor = dado.taxa >= 85 ? '#4CAF50' : dado.taxa >= 70 ? '#FF9800' : '#ef5350';
                      return (
                        <div key={dado.dia} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '100%', height: `${altura}px`,
                            background: `linear-gradient(180deg, ${cor} 0%, ${cor}CC 100%)`,
                            borderRadius: '0.5rem 0.5rem 0 0', display: 'flex',
                            alignItems: 'flex-start', justifyContent: 'center', paddingTop: '0.5rem'
                          }}>
                            <span style={{ color: 'white', fontWeight: '700', fontSize: '0.75rem' }}>{dado.taxa}%</span>
                          </div>
                          <span style={{ fontWeight: '600', fontSize: '0.75rem', color: '#666', whiteSpace: 'nowrap' }}>
                            {dado.dia}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
