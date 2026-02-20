'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PerformanceDepartamento {
  departamento: string;
  totalRespostas: number;
  conformes: number;
  naoConformes: number;
  naAplicavel: number;
  taxa: number;
}

interface Totais {
  totalRespostas: number;
  conformes: number;
  naoConformes: number;
  taxaMedia: number;
}

export default function RelatorioPerformanceDepartamento() {
  const router = useRouter();
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const hoje = new Date().toISOString().split('T')[0];
  const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [filtros, setFiltros] = useState({
    dataInicio: trintaDiasAtras,
    dataFim: hoje,
    empresa: 'todas',
    cargo: 'todos'
  });

  const [empresas, setEmpresas] = useState<{ id: string; nome_fantasia: string }[]>([]);
  const [cargos, setCargos] = useState<string[]>([]);
  const [dados, setDados] = useState<PerformanceDepartamento[]>([]);
  const [totais, setTotais] = useState<Totais>({ totalRespostas: 0, conformes: 0, naoConformes: 0, taxaMedia: 0 });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { router.push('/login'); return; }
    const user = JSON.parse(userStr);
    if (user.role !== 'aluno') { router.push('/login'); return; }
    carregarEmpresas(user.id);
    carregarCargos(user.id);
  }, []);

  async function carregarEmpresas(alunoId: string) {
    const res = await fetch(`/api/aluno/empresas?aluno_id=${alunoId}`);
    if (res.ok) setEmpresas(await res.json());
  }

  async function carregarCargos(alunoId: string) {
    const res = await fetch(`/api/aluno/colaboradores?aluno_id=${alunoId}`);
    if (res.ok) {
      const colaboradores = await res.json();
      const uniqueCargos = [...new Set(colaboradores.map((c: any) => c.cargo))].filter(Boolean) as string[];
      setCargos(uniqueCargos.sort());
    }
  }

  async function enviarAtualizar() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    setCarregando(true);
    try {
      const params = new URLSearchParams({
        aluno_id: user.id,
        data_inicio: filtros.dataInicio,
        data_fim: filtros.dataFim,
        ...(filtros.empresa !== 'todas' && { empresa_id: filtros.empresa }),
        ...(filtros.cargo !== 'todos' && { cargo: filtros.cargo }),
      });

      const res = await fetch(`/api/aluno/relatorio-departamentos?${params}`);
      if (!res.ok) throw new Error('Erro ao carregar dados');
      const data = await res.json();

      setDados(data.departamentos);
      setTotais(data.totais);
      setMostrarResultados(true);
    } catch (error) {
      console.error(error);
      alert('Erro ao carregar relatório. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  const melhor = dados[0];
  const pior = dados[dados.length - 1];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

        {/* Botão Voltar */}
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'white', border: '2px solid #e0e0e0', borderRadius: '0.75rem',
            padding: '0.75rem 1.25rem', fontSize: '0.875rem', fontWeight: '600',
            color: '#5E6AD2', cursor: 'pointer', marginBottom: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>←</span>
          <span>Voltar</span>
        </button>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1a1a1a', margin: '0 0 0.5rem 0' }}>
            Relatório de Performance por Departamento
          </h1>
          <p style={{ color: '#666', fontSize: '1rem', margin: 0 }}>
            Análise comparativa de desempenho entre departamentos
          </p>
        </div>

        {/* Filtros */}
        <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                <span>📅</span> De
              </label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                <span>📅</span> Até
              </label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                <span>🏢</span> Empresa
              </label>
              <select
                value={filtros.empresa}
                onChange={(e) => setFiltros({ ...filtros, empresa: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                <option value="todas">Todas</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome_fantasia}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>
                <span>🏬</span> Departamento (Cargo)
              </label>
              <select
                value={filtros.cargo}
                onChange={(e) => setFiltros({ ...filtros, cargo: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '0.75rem', fontSize: '0.875rem', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                <option value="todos">Todos</option>
                {cargos.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={enviarAtualizar}
            disabled={carregando}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              width: '100%', maxWidth: '250px',
              background: carregando ? '#9ca3af' : 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
              color: 'white', border: 'none', borderRadius: '0.75rem',
              padding: '0.875rem', fontSize: '0.875rem', fontWeight: '700',
              cursor: carregando ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(33,150,243,0.4)'
            }}
          >
            <span>✓</span>
            {carregando ? 'Carregando...' : 'Enviar / Atualizar'}
          </button>
        </div>

        {/* Resultados */}
        {mostrarResultados ? (
          dados.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '1rem', padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: '1.25rem', color: '#6b7280', margin: 0 }}>
                Nenhuma resposta encontrada no período selecionado.
              </p>
            </div>
          ) : (
            <>
              {/* Cards de Resumo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)', borderRadius: '1rem', padding: '1.75rem', color: 'white', boxShadow: '0 4px 12px rgba(33,150,243,0.3)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                  <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0', fontWeight: '600' }}>Total de Respostas</p>
                  <p style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 0.25rem 0' }}>{totais.totalRespostas}</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: 0 }}>no período selecionado</p>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)', borderRadius: '1rem', padding: '1.75rem', color: 'white', boxShadow: '0 4px 12px rgba(76,175,80,0.3)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                  <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0', fontWeight: '600' }}>Conformes</p>
                  <p style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 0.25rem 0' }}>{totais.conformes}</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: 0 }}>
                    {totais.totalRespostas > 0 ? Math.round((totais.conformes / totais.totalRespostas) * 100) : 0}% do total
                  </p>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #ef5350 0%, #e53935 100%)', borderRadius: '1rem', padding: '1.75rem', color: 'white', boxShadow: '0 4px 12px rgba(239,83,80,0.3)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❌</div>
                  <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0', fontWeight: '600' }}>Não Conformes</p>
                  <p style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 0.25rem 0' }}>{totais.naoConformes}</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: 0 }}>
                    {totais.totalRespostas > 0 ? Math.round((totais.naoConformes / totais.totalRespostas) * 100) : 0}% do total
                  </p>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)', borderRadius: '1rem', padding: '1.75rem', color: 'white', boxShadow: '0 4px 12px rgba(156,39,176,0.3)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
                  <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: '0 0 0.5rem 0', fontWeight: '600' }}>Taxa Média</p>
                  <p style={{ fontSize: '3rem', fontWeight: '900', margin: '0 0 0.25rem 0' }}>{totais.taxaMedia}%</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: 0 }}>de conformidade geral</p>
                </div>
              </div>

              {/* Ranking */}
              <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🏆</span>
                  Ranking de Performance por Departamento
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {dados.map((dept, index) => {
                    const corBarra = dept.taxa >= 90 ? '#4CAF50' : dept.taxa >= 75 ? '#2196F3' : '#FF9800';
                    const badges = [
                      'linear-gradient(135deg, #FFD700, #FFA500)',
                      'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
                      'linear-gradient(135deg, #CD7F32, #B8860B)',
                    ];
                    const badgeBg = index < 3 ? badges[index] : '#e0e0e0';

                    return (
                      <div key={dept.departamento}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                          <div style={{
                            width: '50px', height: '50px', borderRadius: '50%',
                            background: badgeBg, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '1.25rem', fontWeight: '900',
                            color: 'white', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}>
                            {index + 1}
                          </div>

                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#333', margin: '0 0 0.25rem 0' }}>
                              {dept.departamento}
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                              {dept.totalRespostas} respostas · {dept.conformes} conformes · {dept.naoConformes} não conformes
                              {dept.naAplicavel > 0 ? ` · ${dept.naAplicavel} N/A` : ''}
                            </p>
                          </div>

                          <div style={{ fontSize: '2rem', fontWeight: '900', color: corBarra, minWidth: '80px', textAlign: 'right' }}>
                            {dept.taxa}%
                          </div>
                        </div>

                        <div style={{ width: '100%', height: '20px', background: '#f0f0f0', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${dept.taxa}%`, height: '100%', background: corBarra,
                            borderRadius: '10px', transition: 'width 1s ease',
                            display: 'flex', alignItems: 'center', paddingLeft: '1rem'
                          }}>
                            {dept.taxa >= 20 && (
                              <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: '700' }}>
                                {dept.taxa}% de conformidade
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Melhor e Pior */}
              {dados.length >= 2 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '6px solid #4CAF50' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '2rem' }}>🥇</span>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#333', margin: 0 }}>Melhor Performance</h4>
                    </div>
                    <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#4CAF50', margin: '0 0 0.5rem 0' }}>{melhor.departamento}</p>
                    <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>Taxa de conformidade: <strong>{melhor.taxa}%</strong></p>
                    <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.25rem 0 0 0' }}>Total de respostas: <strong>{melhor.totalRespostas}</strong></p>
                  </div>

                  <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '6px solid #FF9800' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '2rem' }}>⚠️</span>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#333', margin: 0 }}>Precisa de Atenção</h4>
                    </div>
                    <p style={{ fontSize: '1.5rem', fontWeight: '900', color: '#FF9800', margin: '0 0 0.5rem 0' }}>{pior.departamento}</p>
                    <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>Taxa de conformidade: <strong>{pior.taxa}%</strong></p>
                    <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.25rem 0 0 0' }}>Não conformes: <strong>{pior.naoConformes}</strong></p>
                  </div>
                </div>
              )}
            </>
          )
        ) : (
          <div style={{ background: 'white', borderRadius: '1rem', padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{
              width: '120px', height: '120px',
              background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 2rem', border: '4px solid #90CAF9'
            }}>
              <span style={{ fontSize: '4rem' }}>📊</span>
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#333', marginBottom: '1rem' }}>
              Configure os Filtros
            </h3>
            <p style={{ color: '#666', fontSize: '1rem', margin: 0, lineHeight: 1.6 }}>
              Selecione o período, empresa e departamento desejados, depois clique em "Enviar / Atualizar" para visualizar o relatório.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
