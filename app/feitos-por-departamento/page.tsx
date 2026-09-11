'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Calendar, Building2, Briefcase, Check, BarChart3, CheckCircle, XCircle, TrendingUp, Trophy, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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

const inputClass = 'w-full rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm outline-none cursor-pointer';
const labelClass = 'mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-muted';

function taxaTone(taxa: number) {
  if (taxa >= 90) return { text: 'text-teal', bar: 'bg-teal' };
  if (taxa >= 75) return { text: 'text-blue', bar: 'bg-blue' };
  return { text: 'text-amber', bar: 'bg-amber' };
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
      toast.error('Erro ao carregar relatório. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  const melhor = dados[0];
  const pior = dados[dados.length - 1];

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <PageHeader
          title="Relatório de Performance por Departamento"
          subtitle="Análise comparativa de desempenho entre departamentos"
          backHref="/dashboard-aluno"
        />

        {/* Filtros */}
        <Card className="mb-6 p-6 sm:p-8">
          <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelClass}><Calendar size={15} /> De</label>
              <input type="date" value={filtros.dataInicio} onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}><Calendar size={15} /> Até</label>
              <input type="date" value={filtros.dataFim} onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}><Building2 size={15} /> Empresa</label>
              <select value={filtros.empresa} onChange={(e) => setFiltros({ ...filtros, empresa: e.target.value })} className={inputClass}>
                <option value="todas">Todas</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome_fantasia}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}><Briefcase size={15} /> Departamento (Cargo)</label>
              <select value={filtros.cargo} onChange={(e) => setFiltros({ ...filtros, cargo: e.target.value })} className={inputClass}>
                <option value="todos">Todos</option>
                {cargos.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <Button variant="primary" onClick={enviarAtualizar} disabled={carregando} icon={<Check size={16} />}>
            {carregando ? 'Carregando...' : 'Enviar / Atualizar'}
          </Button>
        </Card>

        {/* Resultados */}
        {mostrarResultados ? (
          dados.length === 0 ? (
            <Card className="px-6 py-16 text-center">
              <p className="text-lg text-ink-muted">Nenhuma resposta encontrada no período selecionado.</p>
            </Card>
          ) : (
            <>
              {/* Cards de Resumo */}
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-brand p-6 shadow-[0_8px_16px_-8px_rgba(255,122,61,0.6)]">
                  <BarChart3 size={26} className="mb-2 text-white" />
                  <p className="mb-1.5 text-xs text-white/85">Total de Respostas</p>
                  <p className="font-display text-4xl font-bold text-white">{totais.totalRespostas}</p>
                  <p className="mt-1 text-xs text-white/75">no período selecionado</p>
                </Card>

                <Card className="p-6">
                  <CheckCircle size={26} className="mb-2 text-teal" />
                  <p className="mb-1.5 text-xs font-semibold text-ink-muted">Conformes</p>
                  <p className="font-display text-3xl font-bold text-teal">{totais.conformes}</p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {totais.totalRespostas > 0 ? Math.round((totais.conformes / totais.totalRespostas) * 100) : 0}% do total
                  </p>
                </Card>

                <Card className="p-6">
                  <XCircle size={26} className="mb-2 text-coral" />
                  <p className="mb-1.5 text-xs font-semibold text-ink-muted">Não Conformes</p>
                  <p className="font-display text-3xl font-bold text-coral">{totais.naoConformes}</p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {totais.totalRespostas > 0 ? Math.round((totais.naoConformes / totais.totalRespostas) * 100) : 0}% do total
                  </p>
                </Card>

                <Card className="p-6">
                  <TrendingUp size={26} className="mb-2 text-violet" />
                  <p className="mb-1.5 text-xs font-semibold text-ink-muted">Taxa Média</p>
                  <p className="font-display text-3xl font-bold text-violet">{totais.taxaMedia}%</p>
                  <p className="mt-1 text-xs text-ink-faint">de conformidade geral</p>
                </Card>
              </div>

              {/* Ranking */}
              <Card className="mb-6 p-6 sm:p-8">
                <h3 className="mb-6 flex items-center gap-2 font-display text-lg font-bold text-ink">
                  <Trophy size={20} className="text-amber" /> Ranking de Performance por Departamento
                </h3>

                <div className="flex flex-col gap-6">
                  {dados.map((dept, index) => {
                    const tone = taxaTone(dept.taxa);
                    const medalha = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;

                    return (
                      <div key={dept.departamento}>
                        <div className="mb-3 flex flex-wrap items-center gap-4">
                          <div className="flex h-[50px] w-[50px] flex-shrink-0 items-center justify-center rounded-full bg-surface-2 text-xl font-bold text-ink-muted">
                            {medalha}
                          </div>

                          <div className="min-w-[200px] flex-1">
                            <h4 className="text-base font-bold text-ink">{dept.departamento}</h4>
                            <p className="text-sm text-ink-muted">
                              {dept.totalRespostas} respostas · {dept.conformes} conformes · {dept.naoConformes} não conformes
                              {dept.naAplicavel > 0 ? ` · ${dept.naAplicavel} N/A` : ''}
                            </p>
                          </div>

                          <div className={`min-w-[80px] text-right text-3xl font-bold ${tone.text}`}>{dept.taxa}%</div>
                        </div>

                        <div className="h-4 w-full overflow-hidden rounded-full bg-surface-2">
                          <div
                            className={`flex h-full items-center rounded-full pl-3 transition-[width] duration-700 ${tone.bar}`}
                            style={{ width: `${dept.taxa}%` }}
                          >
                            {dept.taxa >= 20 && <span className="text-xs font-bold text-white">{dept.taxa}% de conformidade</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Melhor e Pior */}
              {dados.length >= 2 && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Card className="border-l-4 border-teal p-6 sm:p-8">
                    <div className="mb-4 flex items-center gap-3">
                      <Trophy size={26} className="text-teal" />
                      <h4 className="text-base font-bold text-ink">Melhor Performance</h4>
                    </div>
                    <p className="mb-1.5 text-2xl font-bold text-teal">{melhor.departamento}</p>
                    <p className="text-sm text-ink-muted">Taxa de conformidade: <strong className="text-ink">{melhor.taxa}%</strong></p>
                    <p className="mt-1 text-sm text-ink-muted">Total de respostas: <strong className="text-ink">{melhor.totalRespostas}</strong></p>
                  </Card>

                  <Card className="border-l-4 border-amber p-6 sm:p-8">
                    <div className="mb-4 flex items-center gap-3">
                      <AlertTriangle size={26} className="text-amber" />
                      <h4 className="text-base font-bold text-ink">Precisa de Atenção</h4>
                    </div>
                    <p className="mb-1.5 text-2xl font-bold text-amber">{pior.departamento}</p>
                    <p className="text-sm text-ink-muted">Taxa de conformidade: <strong className="text-ink">{pior.taxa}%</strong></p>
                    <p className="mt-1 text-sm text-ink-muted">Não conformes: <strong className="text-ink">{pior.naoConformes}</strong></p>
                  </Card>
                </div>
              )}
            </>
          )
        ) : (
          <Card className="px-6 py-16 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-tint">
              <BarChart3 size={40} className="text-blue" />
            </div>
            <h3 className="mb-3 font-display text-xl font-bold text-ink">Configure os Filtros</h3>
            <p className="text-sm leading-relaxed text-ink-muted">
              Selecione o período, empresa e departamento desejados, depois clique em &quot;Enviar / Atualizar&quot; para visualizar o relatório.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
