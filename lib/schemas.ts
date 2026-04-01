import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export const criarAssinaturaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  cnpj: z.string().optional(),
  nomeEmpresa: z.string().optional(),
  plano: z.enum(['starter', 'growth', 'scale', 'enterprise']).optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type CriarAssinaturaInput = z.infer<typeof criarAssinaturaSchema>
