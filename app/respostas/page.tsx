'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ClipboardList, Calendar, Search, TrendingUp, CheckCircle, XCircle,
  Download, Eye, X, Info, PartyPopper, Building2
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface Filtros {
  empresa_id: string;
  dataInicio: string;
  dataFim: string;
  resultado: string;
}

interface Empresa {
  id: string;
  nome_fantasia: string;
}

interface Resposta {
  id: string;
  empresa: string;
  empresa_id: string;
  checklist: string;
  pergunta: string;
  resposta: string;
  resultado: 'conforme' | 'nao_conforme' | 'na';
  responsavel: string;
  data: string;
  observacao: string;
}

const inputClass = 'w-full rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm outline-none cursor-pointer';
const labelClass = 'mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-muted';

function BadgeResultado({ resultado }: { resultado: string }) {
  if (resultado === 'conforme') return <Badge tone="success"><CheckCircle size={12} /> Conforme</Badge>;
  if (resultado === 'nao_conforme') return <Badge tone="danger"><XCircle size={12} /> Não Conforme</Badge>;
  return <Badge tone="neutral">— N/A</Badge>;
}

export default function TodasRespostas() {
  const router = useRouter();
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [loading, setLoading] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [visualizacao, setVisualizacao] = useState<'lista' | 'resumo'>('lista');
  const [respostaSelecionada, setRespostaSelecionada] = useState<Resposta | null>(null);

  const [filtros, setFiltros] = useState<Filtros>({
    empresa_id: '',
    dataInicio: '',
    dataFim: '',
    resultado: 'todos',
  });

  useEffect(() => {
    verificarAutenticacao();
  }, []);

  async function verificarAutenticacao() {
    const userStr = localStorage.getItem('user');
    if (!userStr) { router.push('/login'); return; }
    const user = JSON.parse(userStr);
    if (user.role !== 'aluno') { router.push('/login'); return; }
    setAlunoId(String(user.id));
    // Carrega empresas para o filtro
    try {
      const res = await fetch(`/api/aluno/empresas?aluno_id=${user.id}`);
      if (res.ok) setEmpresas(await res.json());
    } catch (err) {
      console.error('Erro ao carregar empresas:', err);
    }
  }

  const handleFiltrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alunoId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ aluno_id: alunoId });
      if (filtros.empresa_id) params.set('empresa_id', filtros.empresa_id);
      if (filtros.dataInicio) params.set('data_inicio', filtros.dataInicio);
      if (filtros.dataFim) params.set('data_fim', filtros.dataFim);
      if (filtros.resultado !== 'todos') params.set('resultado', filtros.resultado);

      const res = await fetch(`/api/aluno/respostas?${params.toString()}`);
      if (!res.ok) throw new Error('Erro ao carregar');
      const { respostas: data } = await res.json();
      setRespostas(data || []);
      setMostrarResultados(true);
    } catch (err) {
      console.error('Erro ao carregar respostas:', err);
      toast.error('Erro ao carregar respostas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const totalRespostas = respostas.length;
  const conformes = respostas.filter(r => r.resultado === 'conforme').length;
  const naoConformes = respostas.filter(r => r.resultado === 'nao_conforme').length;
  const taxaConformidade = totalRespostas > 0 ? Math.round((conformes / totalRespostas) * 100) : 0;
  const taxaTone = taxaConformidade >= 80 ? 'text-teal' : taxaConformidade >= 60 ? 'text-amber' : 'text-coral';

  const exportarExcel = () => {
    if (respostas.length === 0) {
      toast.error('Nenhuma resposta para exportar.');
      return;
    }

    const headers = ['Data/Hora', 'Empresa', 'Checklist', 'Pergunta', 'Responsável', 'Resultado', 'Resposta', 'Observação'];
    const resultadoLabel = (r: string) =>
      r === 'conforme' ? 'Conforme' : r === 'nao_conforme' ? 'Não Conforme' : 'N/A';

    const rows = respostas.map(r => [
      r.data,
      r.empresa,
      r.checklist,
      r.pergunta,
      r.responsavel,
      resultadoLabel(r.resultado),
      r.resposta,
      r.observacao,
    ]);

    const escape = (v: string) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const tableRows = [headers, ...rows]
      .map(row => `<tr>${row.map(cell => `<td>${escape(String(cell))}</td>`).join('')}</tr>`)
      .join('');

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"></head>
      <body><table>${tableRows}</table></body>
      </html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respostas-${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${respostas.length} respostas exportadas com sucesso!`);
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1320px] px-6 py-8">
        <PageHeader
          title="Todas as Respostas do Período"
          subtitle="Visualize e analise todas as respostas de checklists em um único lugar"
          backHref="/dashboard-aluno"
        />

        {/* Card de Filtros */}
        <Card className="mb-6 p-6 sm:p-8">
          <form onSubmit={handleFiltrar}>
            <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className={labelClass}><Building2 size={15} /> Loja / Empresa</label>
                <select value={filtros.empresa_id} onChange={(e) => setFiltros({ ...filtros, empresa_id: e.target.value })} className={inputClass}>
                  <option value="">Todas as empresas</option>
                  {empresas.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.nome_fantasia}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}><Calendar size={15} /> A partir de</label>
                <input type="date" value={filtros.dataInicio} onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}><Calendar size={15} /> Até</label>
                <input type="date" value={filtros.dataFim} onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}><Search size={15} /> Filtrar por resultado</label>
                <select value={filtros.resultado} onChange={(e) => setFiltros({ ...filtros, resultado: e.target.value })} className={inputClass}>
                  <option value="todos">Todos os resultados</option>
                  <option value="conforme">✓ Conforme</option>
                  <option value="nao_conforme">✗ Não Conforme</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button type="submit" variant="primary" disabled={loading} className="w-full justify-center py-3" icon={<Search size={16} />}>
                  {loading ? 'Carregando...' : 'Filtrar Respostas'}
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-blue-tint p-4">
              <Info size={18} className="mt-0.5 flex-shrink-0 text-blue" />
              <p className="text-sm leading-relaxed text-blue">
                <strong>Dica:</strong> Nessa tela é possível ver todas as respostas de uma única vez de todas as empresas, assim você consegue ser mais preciso no que procura, como por exemplo apenas as áreas que estão com algum problema e que as respostas foram negativas.
              </p>
            </div>
          </form>
        </Card>

        {mostrarResultados ? (
          <>
            {/* Cards de Resumo */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-muted">Total de Respostas</span>
                  <ClipboardList size={18} className="text-ink-faint" />
                </div>
                <p className="font-display text-3xl font-bold text-ink">{totalRespostas}</p>
                <p className="mt-1 text-xs text-ink-faint">no período selecionado</p>
              </Card>

              <Card className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-muted">Conformes</span>
                  <CheckCircle size={18} className="text-teal" />
                </div>
                <p className="font-display text-3xl font-bold text-teal">{conformes}</p>
                <p className="mt-1 text-xs text-ink-faint">
                  {totalRespostas > 0 ? Math.round((conformes / totalRespostas) * 100) : 0}% do total
                </p>
              </Card>

              <Card className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-muted">Não Conformes</span>
                  <XCircle size={18} className="text-coral" />
                </div>
                <p className="font-display text-3xl font-bold text-coral">{naoConformes}</p>
                <p className="mt-1 text-xs text-ink-faint">
                  {totalRespostas > 0 ? Math.round((naoConformes / totalRespostas) * 100) : 0}% do total
                </p>
              </Card>

              <Card className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-muted">Taxa de Conformidade</span>
                  <TrendingUp size={18} className="text-ink-faint" />
                </div>
                <p className={`font-display text-3xl font-bold ${taxaTone}`}>{taxaConformidade}%</p>
                <p className="mt-1 text-xs text-ink-faint">índice geral</p>
              </Card>
            </div>

            {/* Ações e Visualização */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2.5">
                <Button variant={visualizacao === 'lista' ? 'primary' : 'secondary'} onClick={() => setVisualizacao('lista')} icon={<ClipboardList size={16} />}>
                  Lista Detalhada
                </Button>
                <Button variant={visualizacao === 'resumo' ? 'primary' : 'secondary'} onClick={() => setVisualizacao('resumo')} icon={<TrendingUp size={16} />}>
                  Resumo Executivo
                </Button>
              </div>

              <Button variant="secondary" onClick={exportarExcel} icon={<Download size={16} />}>
                Exportar Excel
              </Button>
            </div>

            {/* Lista de Respostas */}
            {visualizacao === 'lista' && (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-surface-2 bg-surface-2">
                        <th className="p-4 text-left text-sm font-semibold text-ink-muted">Data/Hora</th>
                        <th className="p-4 text-left text-sm font-semibold text-ink-muted">Empresa</th>
                        <th className="p-4 text-left text-sm font-semibold text-ink-muted">Checklist</th>
                        <th className="p-4 text-left text-sm font-semibold text-ink-muted">Pergunta</th>
                        <th className="p-4 text-left text-sm font-semibold text-ink-muted">Responsável</th>
                        <th className="p-4 text-center text-sm font-semibold text-ink-muted">Resultado</th>
                        <th className="p-4 text-center text-sm font-semibold text-ink-muted">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {respostas.map((resposta) => (
                        <tr key={resposta.id} className="border-b border-surface-2 transition-colors last:border-0 hover:bg-surface-2">
                          <td className="whitespace-nowrap p-4 text-sm text-ink-muted">{resposta.data}</td>
                          <td className="p-4 text-sm font-semibold text-ink">{resposta.empresa}</td>
                          <td className="p-4 text-sm text-ink-muted">{resposta.checklist}</td>
                          <td className="max-w-[300px] p-4 text-sm text-ink-muted">{resposta.pergunta}</td>
                          <td className="p-4 text-sm text-ink-muted">{resposta.responsavel}</td>
                          <td className="p-4 text-center"><BadgeResultado resultado={resposta.resultado} /></td>
                          <td className="p-4 text-center">
                            <Button variant="secondary" size="sm" onClick={() => setRespostaSelecionada(resposta)} icon={<Eye size={15} />} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {respostas.length === 0 && (
                  <div className="py-16 text-center">
                    <Search size={40} className="mx-auto mb-4 text-ink-faint" />
                    <p className="text-sm font-semibold text-ink-muted">
                      Nenhuma resposta encontrada com os filtros selecionados.
                    </p>
                  </div>
                )}
              </Card>
            )}

            {/* Resumo Executivo */}
            {visualizacao === 'resumo' && (
              <div className="flex flex-col gap-4">
                {respostas
                  .filter(r => r.resultado === 'nao_conforme')
                  .map((resposta) => (
                    <Card key={resposta.id} className="border-l-4 border-coral p-6">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-ink">{resposta.empresa}</h3>
                          <p className="mt-1 text-sm text-ink-muted">{resposta.checklist}</p>
                          <p className="mt-1 text-xs text-ink-faint">{resposta.data} • {resposta.responsavel}</p>
                        </div>
                        <Badge tone="danger"><XCircle size={13} /> Não Conforme</Badge>
                      </div>

                      <div className="rounded-xl bg-surface-2 p-5">
                        <p className="mb-1.5 text-sm font-bold text-ink">Pergunta:</p>
                        <p className={`text-sm text-ink-muted ${resposta.observacao ? 'mb-4' : ''}`}>{resposta.pergunta}</p>

                        {resposta.observacao && (
                          <>
                            <p className="mb-1.5 text-sm font-bold text-ink">Observação:</p>
                            <p className="text-sm text-ink-muted">{resposta.observacao}</p>
                          </>
                        )}
                      </div>
                    </Card>
                  ))}

                {respostas.filter(r => r.resultado === 'nao_conforme').length === 0 && (
                  <Card className="px-6 py-16 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-tint">
                      <PartyPopper size={36} className="text-teal" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-ink">Tudo em conformidade!</h3>
                    <p className="mt-2 text-sm text-ink-muted">Não há itens não conformes no período selecionado.</p>
                  </Card>
                )}
              </div>
            )}
          </>
        ) : (
          <Card className="px-6 py-16 text-center">
            <div className="mx-auto max-w-[500px]">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-violet-tint">
                <Search size={40} className="text-violet" />
              </div>
              <h3 className="mb-3 font-display text-xl font-bold text-ink">Configure os Filtros</h3>
              <p className="text-sm leading-relaxed text-ink-muted">
                Selecione os filtros desejados e clique em &quot;Filtrar Respostas&quot; para visualizar os dados.
              </p>
            </div>
          </Card>
        )}

        {/* Modal de Detalhes */}
        {respostaSelecionada && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setRespostaSelecionada(null)}
          >
            <div
              className="max-h-[80vh] w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-6 shadow-soft sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-ink">Detalhes da Resposta</h3>
                <button onClick={() => setRespostaSelecionada(null)} className="rounded-lg p-2 text-ink-muted hover:bg-surface-2">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <p className="mb-1 text-xs text-ink-faint">Empresa</p>
                  <p className="text-base font-semibold text-ink">{respostaSelecionada.empresa}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-ink-faint">Checklist</p>
                  <p className="text-base font-semibold text-ink">{respostaSelecionada.checklist}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-ink-faint">Pergunta</p>
                  <p className="text-base text-ink">{respostaSelecionada.pergunta}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-ink-faint">Resposta</p>
                  <p className="text-base font-semibold text-ink">{respostaSelecionada.resposta}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-1 text-xs text-ink-faint">Data/Hora</p>
                    <p className="text-sm text-ink">{respostaSelecionada.data}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-ink-faint">Responsável</p>
                    <p className="text-sm text-ink">{respostaSelecionada.responsavel}</p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs text-ink-faint">Resultado</p>
                  <BadgeResultado resultado={respostaSelecionada.resultado} />
                </div>
                {respostaSelecionada.observacao && (
                  <div>
                    <p className="mb-1 text-xs text-ink-faint">Observação</p>
                    <div className="rounded-xl bg-surface-2 p-4">
                      <p className="text-sm text-ink">{respostaSelecionada.observacao}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
