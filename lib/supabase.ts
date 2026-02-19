import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'admin' | 'aluno' | 'colaborador'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

// ALUNO (cliente da Rosadas Tech)
export interface Aluno {
  id: number
  email: string
  nome_fantasia: string
  razao_social?: string
  cnpj?: string
  endereco?: string
  cidade?: string
  estado?: string
  telefone?: string
  celular?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

// EMPRESA (supermercado do aluno)
export interface Empresa {
  id: string
  aluno_id: number
  nome_fantasia: string
  razao_social?: string
  cnpj?: string
  endereco?: string
  cidade?: string
  estado?: string
  telefone?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

// COLABORADOR (trabalha na empresa)
export interface Colaborador {
  id: string
  auth_id: string
  empresa_id: string
  email: string
  nome: string
  celular?: string
  telefone?: string
  cargo: string
  ativo: boolean
  created_at: string
  updated_at: string
}

// CHECKLIST TEMPLATE
export interface ChecklistTemplate {
  id: string
  nome: string
  descricao?: string
  ativo: boolean
  created_at: string
}

// CHECKLIST FUTURO (atribuído a uma empresa e colaborador)
export interface ChecklistFuturo {
  id: string
  template_id?: string
  empresa_id: string
  colaborador_id?: string
  titulo: string
  descricao?: string
  status: 'pendente' | 'em_andamento' | 'concluido'
  data_inicio: string
  data_fim: string
  ativo: boolean
  created_at: string
  updated_at: string
}

// ITEM DO CHECKLIST FUTURO
export interface ChecklistFuturoItem {
  id: string
  checklist_futuro_id: string
  titulo: string
  descricao?: string
  ordem: number
  obrigatorio: boolean
  tipo: 'checkbox' | 'texto' | 'numero' | 'foto'
  created_at: string
}

// AÇÃO CORRETIVA
export interface AcaoCorretiva {
  id: string
  empresa_id: string
  checklist_id?: string
  item_id?: string
  titulo: string
  descricao?: string
  responsavel?: string
  prazo?: string
  status: 'aguardando' | 'em_andamento' | 'concluida' | 'atrasada'
  prioridade: 'baixa' | 'media' | 'alta'
  categoria?: string
  orcamento?: number
  valor_pago?: number
  observacoes?: string
  urgente: boolean
  created_at: string
  updated_at: string
}

// RESPOSTA DO CHECKLIST
export interface ChecklistResposta {
  id: string
  checklist_futuro_id: string
  item_id: string
  colaborador_id: string
  resposta?: string
  foto_url?: string
  respondido_por: string
  respondido_em: string
  created_at: string
}