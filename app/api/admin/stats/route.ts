import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase-admin'

const db = createAdminClient


export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 })
  }

  const supabase = db()

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  const inicioMesISO = inicioMes.toISOString()

  const ha30Dias = new Date()
  ha30Dias.setDate(ha30Dias.getDate() - 30)
  const ha30DaysISO = ha30Dias.toISOString()

  // Buscar tudo de uma vez, em paralelo — checklists e ações são buscados
  // completos (sem filtro) uma única vez, e os recortes por mês/30 dias são
  // derivados em memória, em vez de repetir a mesma tabela em várias queries
  // filtradas e seriais.
  const [{ data: alunos }, { data: empresas }, { data: todosChecklists }, { data: todasAcoes }] = await Promise.all([
    supabase
      .from('alunos')
      .select('id, clientes, "e-mail", ativo, ultimo_login, origem')
      .neq('tipo', 'admin')
      .order('clientes'),
    supabase
      .from('empresas')
      .select('id, aluno_id, nome_fantasia'),
    supabase
      .from('checklists_futuros')
      .select('id, empresa_id, status, created_at, updated_at'),
    supabase
      .from('acoes_corretivas')
      .select('id, empresa_id, status, created_at, titulo'),
  ])

  if (!alunos) return NextResponse.json({ usoMensal: [], alertas: [], performanceGeral: [] })

  const empresaMap: Record<string, { aluno_id: string; nome_fantasia: string }> = {}
  for (const emp of empresas || []) {
    empresaMap[emp.id] = { aluno_id: String(emp.aluno_id), nome_fantasia: emp.nome_fantasia }
  }

  const empresaIdsPorAluno: Record<string, string[]> = {}
  for (const [empId, empData] of Object.entries(empresaMap)) {
    const aid = empData.aluno_id
    if (!empresaIdsPorAluno[aid]) empresaIdsPorAluno[aid] = []
    empresaIdsPorAluno[aid].push(empId)
  }

  // Montar estrutura de uso mensal por aluno (checklists/ações criados desde o início do mês)
  const checklistsPorEmpresa: Record<string, number> = {}
  const acoesPorEmpresa: Record<string, number> = {}
  const atrasadasPorEmpresa: Record<string, number> = {}
  const empresasComAtividade = new Set<string>()

  for (const cl of todosChecklists || []) {
    if (cl.created_at >= inicioMesISO) {
      checklistsPorEmpresa[cl.empresa_id] = (checklistsPorEmpresa[cl.empresa_id] || 0) + 1
    }
    if (cl.updated_at && cl.updated_at >= ha30DaysISO) {
      empresasComAtividade.add(cl.empresa_id)
    }
  }

  for (const ac of todasAcoes || []) {
    if (ac.created_at >= inicioMesISO) {
      acoesPorEmpresa[ac.empresa_id] = (acoesPorEmpresa[ac.empresa_id] || 0) + 1
    }
    if (ac.created_at >= ha30DaysISO) {
      empresasComAtividade.add(ac.empresa_id)
    }
    if (ac.status === 'atrasada') {
      atrasadasPorEmpresa[ac.empresa_id] = (atrasadasPorEmpresa[ac.empresa_id] || 0) + 1
    }
  }

  const clTotalPorEmpresa: Record<string, { total: number; concluidos: number }> = {}
  for (const cl of todosChecklists || []) {
    if (!clTotalPorEmpresa[cl.empresa_id]) clTotalPorEmpresa[cl.empresa_id] = { total: 0, concluidos: 0 }
    clTotalPorEmpresa[cl.empresa_id].total++
    if (cl.status === 'concluido') clTotalPorEmpresa[cl.empresa_id].concluidos++
  }

  const acTotalPorEmpresa: Record<string, { total: number; concluidas: number; atrasadas: number }> = {}
  for (const ac of todasAcoes || []) {
    if (!acTotalPorEmpresa[ac.empresa_id]) acTotalPorEmpresa[ac.empresa_id] = { total: 0, concluidas: 0, atrasadas: 0 }
    acTotalPorEmpresa[ac.empresa_id].total++
    if (ac.status === 'concluida') acTotalPorEmpresa[ac.empresa_id].concluidas++
    if (ac.status === 'atrasada') acTotalPorEmpresa[ac.empresa_id].atrasadas++
  }

  // Montar resultado por aluno
  const usoMensal = alunos
    .filter(a => a.ativo)
    .map(aluno => {
      const empIds = empresaIdsPorAluno[String(aluno.id)] || []
      const checklists = empIds.reduce((s, id) => s + (checklistsPorEmpresa[id] || 0), 0)
      const acoes = empIds.reduce((s, id) => s + (acoesPorEmpresa[id] || 0), 0)
      return {
        aluno_id: aluno.id,
        nome: aluno.clientes || aluno['e-mail'] || 'Sem nome',
        checklists,
        acoes,
        total: checklists + acoes,
      }
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // Montar alertas
  const alertas: { tipo: string; nome: string; detalhe: string }[] = []

  for (const aluno of alunos.filter(a => a.ativo)) {
    const empIds = empresaIdsPorAluno[String(aluno.id)] || []
    const totalAtrasadas = empIds.reduce((s, id) => s + (atrasadasPorEmpresa[id] || 0), 0)
    if (totalAtrasadas > 0) {
      alertas.push({
        tipo: 'atrasada',
        nome: aluno.clientes || aluno['e-mail'] || 'Sem nome',
        detalhe: `${totalAtrasadas} ação${totalAtrasadas > 1 ? 'ões' : ''} atrasada${totalAtrasadas > 1 ? 's' : ''}`,
      })
    }
  }

  for (const aluno of alunos.filter(a => a.ativo)) {
    const empIds = empresaIdsPorAluno[String(aluno.id)] || []
    const temAtividade = empIds.some(id => empresasComAtividade.has(id))
    if (!temAtividade && empIds.length > 0) {
      alertas.push({
        tipo: 'sem_atividade',
        nome: aluno.clientes || aluno['e-mail'] || 'Sem nome',
        detalhe: 'Sem atividade nos últimos 30 dias',
      })
    }
  }

  // Montar performance geral por aluno
  const performanceGeral = alunos.map(aluno => {
    const empIds = empresaIdsPorAluno[String(aluno.id)] || []
    const clTotal = empIds.reduce((s, id) => s + (clTotalPorEmpresa[id]?.total || 0), 0)
    const clConcluidos = empIds.reduce((s, id) => s + (clTotalPorEmpresa[id]?.concluidos || 0), 0)
    const acTotal = empIds.reduce((s, id) => s + (acTotalPorEmpresa[id]?.total || 0), 0)
    const acConcluidas = empIds.reduce((s, id) => s + (acTotalPorEmpresa[id]?.concluidas || 0), 0)
    const acAtrasadas = empIds.reduce((s, id) => s + (acTotalPorEmpresa[id]?.atrasadas || 0), 0)
    const checklistsMesAluno = empIds.reduce((s, id) => s + (checklistsPorEmpresa[id] || 0), 0)
    const acoesMesAluno = empIds.reduce((s, id) => s + (acoesPorEmpresa[id] || 0), 0)
    return {
      aluno_id: aluno.id,
      nome: aluno.clientes || aluno['e-mail'] || 'Sem nome',
      email: aluno['e-mail'],
      ativo: aluno.ativo,
      origem: aluno.origem,
      ultimo_login: aluno.ultimo_login ?? null,
      empresas: empIds.length,
      checklists: { total: clTotal, concluidos: clConcluidos, mes: checklistsMesAluno },
      acoes: { total: acTotal, concluidas: acConcluidas, atrasadas: acAtrasadas, mes: acoesMesAluno },
    }
  })

  return NextResponse.json({ usoMensal, alertas, performanceGeral })
}
