const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// ===== CONFIGURE AQUI =====
const ADMIN_EMAIL = 'admin@semerro.com'
const ADMIN_SENHA = 'Admin@2024!'   // Mude para a senha desejada
const ADMIN_NOME  = 'Administrador'
// ==========================

async function criarAdmin() {
  console.log('🚀 Criando conta admin...\n')

  try {
    // 1. Verificar se já existe no Auth
    const { data: usuariosExistentes } = await supabaseAdmin.auth.admin.listUsers()
    const jaExiste = usuariosExistentes?.users?.find(u => u.email === ADMIN_EMAIL)

    let userId

    if (jaExiste) {
      console.log(`⚠️  Usuário ${ADMIN_EMAIL} já existe no Auth. Atualizando senha...`)
      const { data: atualizado, error } = await supabaseAdmin.auth.admin.updateUserById(
        jaExiste.id,
        { password: ADMIN_SENHA, email_confirm: true }
      )
      if (error) throw new Error(`Erro ao atualizar senha: ${error.message}`)
      userId = jaExiste.id
      console.log('✅ Senha atualizada!')
    } else {
      console.log(`📧 Criando usuário ${ADMIN_EMAIL} no Auth...`)
      const { data: novoUser, error } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_SENHA,
        email_confirm: true,
        user_metadata: { full_name: ADMIN_NOME }
      })
      if (error) throw new Error(`Erro ao criar usuário: ${error.message}`)
      userId = novoUser.user.id
      console.log('✅ Usuário criado no Auth!')
    }

    // 2. Verificar/criar user_profiles
    const { data: perfilExistente } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (perfilExistente) {
      console.log('⚠️  Perfil já existe em user_profiles.')
    } else {
      console.log('📋 Criando perfil em user_profiles...')
      const { error: perfilError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: userId,
          email: ADMIN_EMAIL,
          full_name: ADMIN_NOME,
          role: 'admin'
        })
      if (perfilError) throw new Error(`Erro ao criar perfil: ${perfilError.message}`)
      console.log('✅ Perfil criado em user_profiles!')
    }

    console.log('\n🎉 Admin configurado com sucesso!')
    console.log(`   Email: ${ADMIN_EMAIL}`)
    console.log(`   Senha: ${ADMIN_SENHA}`)
    console.log('\n⚠️  ATENÇÃO: Mude a senha depois do primeiro acesso!')

  } catch (error) {
    console.error('\n❌ Erro:', error.message)
    process.exit(1)
  }
}

criarAdmin()
