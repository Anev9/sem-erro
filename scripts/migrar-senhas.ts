/**
 * Script de migração: define a senha de todos os alunos como "123mudar" (com hash bcrypt)
 *
 * Rodar UMA VEZ:
 *   npx tsx scripts/migrar-senhas.ts
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  console.log('Iniciando migração de senhas...\n')

  const NOVA_SENHA = '123mudar'
  const hash = await bcrypt.hash(NOVA_SENHA, 10)

  console.log(`Hash gerado: ${hash}\n`)

  // Buscar todos os alunos
  const { data: alunos, error } = await supabase
    .from('alunos')
    .select('id, e-mail')

  if (error) {
    console.error('Erro ao buscar alunos:', error.message)
    process.exit(1)
  }

  console.log(`Total de alunos encontrados: ${alunos?.length ?? 0}\n`)

  let atualizados = 0
  let falhas = 0

  for (const aluno of alunos ?? []) {
    const { error: updateError } = await supabase
      .from('alunos')
      .update({ senha: hash })
      .eq('id', aluno.id)

    if (updateError) {
      console.error(`  ✗ Falha ao atualizar aluno ${aluno['e-mail']}: ${updateError.message}`)
      falhas++
    } else {
      console.log(`  ✓ ${aluno['e-mail']}`)
      atualizados++
    }
  }

  console.log(`\nMigração concluída!`)
  console.log(`  Atualizados: ${atualizados}`)
  console.log(`  Falhas: ${falhas}`)
  console.log(`\nTodos os alunos agora fazem login com a senha: ${NOVA_SENHA}`)
}

main()
