const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuração do Supabase com Service Role (admin powers!)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function importarAlunos() {
  console.log('🚀 Iniciando importação de alunos...\n')

  try {
    // 1. Buscar todos os alunos
    console.log('📋 Buscando alunos na tabela...')
    const { data: alunos, error: alunosError } = await supabaseAdmin
      .from('alunos')  // MUDEI DE 'clientes' PARA 'alunos'
      .select('clientes, "e-mail"')

    if (alunosError) {
      console.error('❌ Erro ao buscar alunos:', alunosError)
      return
    }

    if (!alunos || alunos.length === 0) {
      console.log('⚠️  Nenhum aluno encontrado!')
      return
    }

    console.log(`✅ Encontrados ${alunos.length} alunos!\n`)

    // 2. Criar usuários para cada aluno
    let sucessos = 0
    let erros = 0

    for (const aluno of alunos) {
      const email = aluno['e-mail']
      const nome = aluno.clientes

      if (!email) {
        console.log(`⚠️  Aluno "${nome}" não tem email. Pulando...`)
        erros++
        continue
      }

      try {
        // Criar usuário de autenticação
        const { data: user, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: '123mudar',
          email_confirm: true,
          user_metadata: {
            full_name: nome
          }
        })

        if (authError) {
          // Se o erro for "usuário já existe", não é um problema
          if (authError.message.includes('already registered')) {
            console.log(`ℹ️  ${email} - Usuário já existe`)
          } else {
            console.error(`❌ ${email} - Erro: ${authError.message}`)
            erros++
          }
          continue
        }

        // Atualizar o perfil com o nome completo
        await supabaseAdmin
          .from('user_profiles')
          .update({ full_name: nome })
          .eq('id', user.user.id)

        console.log(`✅ ${email} - Criado com sucesso!`)
        sucessos++

      } catch (err) {
        console.error(`❌ ${email} - Erro: ${err.message}`)
        erros++
      }
    }

    // Resumo final
    console.log('\n' + '='.repeat(50))
    console.log('📊 RESUMO DA IMPORTAÇÃO')
    console.log('='.repeat(50))
    console.log(`✅ Sucessos: ${sucessos}`)
    console.log(`❌ Erros: ${erros}`)
    console.log(`📋 Total: ${alunos.length}`)
    console.log('='.repeat(50))
    console.log('\n🎉 Importação finalizada!')
    console.log('🔑 Senha padrão de todos: 123mudar')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar o script
importarAlunos()