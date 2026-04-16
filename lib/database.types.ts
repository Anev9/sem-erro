export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      acoes_corretivas: {
        Row: {
          categoria: string | null
          checklist_id: string | null
          created_at: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          item_id: string | null
          observacoes: string | null
          orcamento: number | null
          prazo: string | null
          prioridade: string | null
          responsavel: string | null
          status: string | null
          titulo: string
          updated_at: string | null
          urgente: boolean | null
          valor_pago: number | null
        }
        Insert: {
          categoria?: string | null
          checklist_id?: string | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          item_id?: string | null
          observacoes?: string | null
          orcamento?: number | null
          prazo?: string | null
          prioridade?: string | null
          responsavel?: string | null
          status?: string | null
          titulo: string
          updated_at?: string | null
          urgente?: boolean | null
          valor_pago?: number | null
        }
        Update: {
          categoria?: string | null
          checklist_id?: string | null
          created_at?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          item_id?: string | null
          observacoes?: string | null
          orcamento?: number | null
          prazo?: string | null
          prioridade?: string | null
          responsavel?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string | null
          urgente?: boolean | null
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "acoes_corretivas_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists_futuros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acoes_corretivas_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "vw_checklists_pendentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acoes_corretivas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acoes_corretivas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_checklists_pendentes"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "acoes_corretivas_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_futuro_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      actions: {
        Row: {
          checklist_id: string
          created_at: string | null
          descricao: string | null
          id: string
          obrigatoria: boolean | null
          ordem: number | null
          status: string | null
          tipo: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          checklist_id: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          obrigatoria?: boolean | null
          ordem?: number | null
          status?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          checklist_id?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          obrigatoria?: boolean | null
          ordem?: number | null
          status?: string | null
          tipo?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actions_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      alunos: {
        Row: {
          ativo: boolean | null
          auditor_atribui_acao: boolean | null
          auth_id: string | null
          cidade: string | null
          clientes: string | null
          cnpj: string | null
          created_at: string | null
          "e-mail": string | null
          endereco: string | null
          estado: string | null
          foto_url: string | null
          id: number
          programa: string
          senha: string | null
          telefone: string | null
          tipo: string | null
          tipo_empresa: string | null
        }
        Insert: {
          ativo?: boolean | null
          auditor_atribui_acao?: boolean | null
          auth_id?: string | null
          cidade?: string | null
          clientes?: string | null
          cnpj?: string | null
          created_at?: string | null
          "e-mail"?: string | null
          endereco?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: number
          programa: string
          senha?: string | null
          telefone?: string | null
          tipo?: string | null
          tipo_empresa?: string | null
        }
        Update: {
          ativo?: boolean | null
          auditor_atribui_acao?: boolean | null
          auth_id?: string | null
          cidade?: string | null
          clientes?: string | null
          cnpj?: string | null
          created_at?: string | null
          "e-mail"?: string | null
          endereco?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: number
          programa?: string
          senha?: string | null
          telefone?: string | null
          tipo?: string | null
          tipo_empresa?: string | null
        }
        Relationships: []
      }
      checklist_futuro_itens: {
        Row: {
          checklist_futuro_id: string
          created_at: string | null
          descricao: string | null
          foto_obrigatoria: boolean
          id: string
          ordem: number
          titulo: string
        }
        Insert: {
          checklist_futuro_id: string
          created_at?: string | null
          descricao?: string | null
          foto_obrigatoria?: boolean
          id?: string
          ordem: number
          titulo: string
        }
        Update: {
          checklist_futuro_id?: string
          created_at?: string | null
          descricao?: string | null
          foto_obrigatoria?: boolean
          id?: string
          ordem?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_futuro_itens_checklist_futuro_id_fkey"
            columns: ["checklist_futuro_id"]
            isOneToOne: false
            referencedRelation: "checklists_futuros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_futuro_itens_checklist_futuro_id_fkey"
            columns: ["checklist_futuro_id"]
            isOneToOne: false
            referencedRelation: "vw_checklists_pendentes"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_item_comentarios: {
        Row: {
          autor: string
          checklist_id: string
          created_at: string | null
          id: string
          item_id: string
          texto: string
        }
        Insert: {
          autor?: string
          checklist_id: string
          created_at?: string | null
          id?: string
          item_id: string
          texto: string
        }
        Update: {
          autor?: string
          checklist_id?: string
          created_at?: string | null
          id?: string
          item_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_item_comentarios_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists_futuros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_item_comentarios_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "vw_checklists_pendentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_item_comentarios_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_futuro_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_respostas: {
        Row: {
          checklist_futuro_id: string | null
          colaborador_id: string | null
          data_resposta: string | null
          foto_url: string | null
          id: string
          item_id: string | null
          observacao: string | null
          respondido_em: string | null
          respondido_por: string | null
          resposta: string | null
        }
        Insert: {
          checklist_futuro_id?: string | null
          colaborador_id?: string | null
          data_resposta?: string | null
          foto_url?: string | null
          id?: string
          item_id?: string | null
          observacao?: string | null
          respondido_em?: string | null
          respondido_por?: string | null
          resposta?: string | null
        }
        Update: {
          checklist_futuro_id?: string | null
          colaborador_id?: string | null
          data_resposta?: string | null
          foto_url?: string | null
          id?: string
          item_id?: string | null
          observacao?: string | null
          respondido_em?: string | null
          respondido_por?: string | null
          resposta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_respostas_checklist_futuro_id_fkey"
            columns: ["checklist_futuro_id"]
            isOneToOne: false
            referencedRelation: "checklists_futuros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_respostas_checklist_futuro_id_fkey"
            columns: ["checklist_futuro_id"]
            isOneToOne: false
            referencedRelation: "vw_checklists_pendentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_respostas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_respostas_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_futuro_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_respostas_respondido_por_fkey"
            columns: ["respondido_por"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_template_itens: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          ordem: number
          template_id: string
          titulo: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          ordem: number
          template_id: string
          titulo: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          ordem?: number
          template_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_template_itens_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          categoria: string | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      checklist_versoes: {
        Row: {
          checklist_id: string
          created_at: string | null
          descricao: string | null
          id: string
          itens: Json
          titulo: string
          versao: number
        }
        Insert: {
          checklist_id: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          itens?: Json
          titulo: string
          versao?: number
        }
        Update: {
          checklist_id?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          itens?: Json
          titulo?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "checklist_versoes_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists_futuros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_versoes_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "vw_checklists_pendentes"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          created_at: string | null
          criado_por: string | null
          descricao: string | null
          empresa_id: string | null
          id: string
          is_template: boolean | null
          nome: string
          proxima_execucao: string | null
          status: string | null
          tipo_negocio: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          criado_por?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          is_template?: boolean | null
          nome: string
          proxima_execucao?: string | null
          status?: string | null
          tipo_negocio?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          criado_por?: string | null
          descricao?: string | null
          empresa_id?: string | null
          id?: string
          is_template?: boolean | null
          nome?: string
          proxima_execucao?: string | null
          status?: string | null
          tipo_negocio?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklists_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_checklists_pendentes"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      checklists_futuros: {
        Row: {
          aluno_id: number | null
          ativo: boolean | null
          chave_compartilhamento: string | null
          colaborador_id: string | null
          concluido_em: string | null
          concluido_por: string | null
          created_at: string | null
          criado_em: string | null
          criado_por: string | null
          data_fim: string | null
          data_inicio: string | null
          departamento: string | null
          descricao: string | null
          dias_tolerancia: number | null
          empresa_id: string | null
          id: string
          nome: string
          prazo_alerta: string | null
          progresso_percentual: number | null
          proxima_execucao: string
          recorrencia: string | null
          status: string | null
          supermercado_id: string | null
          template_id: string | null
          tipo_negocio: string | null
          titulo: string | null
          updated_at: string | null
        }
        Insert: {
          aluno_id?: number | null
          ativo?: boolean | null
          chave_compartilhamento?: string | null
          colaborador_id?: string | null
          concluido_em?: string | null
          concluido_por?: string | null
          created_at?: string | null
          criado_em?: string | null
          criado_por?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          departamento?: string | null
          descricao?: string | null
          dias_tolerancia?: number | null
          empresa_id?: string | null
          id?: string
          nome: string
          prazo_alerta?: string | null
          progresso_percentual?: number | null
          proxima_execucao: string
          recorrencia?: string | null
          status?: string | null
          supermercado_id?: string | null
          template_id?: string | null
          tipo_negocio?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Update: {
          aluno_id?: number | null
          ativo?: boolean | null
          chave_compartilhamento?: string | null
          colaborador_id?: string | null
          concluido_em?: string | null
          concluido_por?: string | null
          created_at?: string | null
          criado_em?: string | null
          criado_por?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          departamento?: string | null
          descricao?: string | null
          dias_tolerancia?: number | null
          empresa_id?: string | null
          id?: string
          nome?: string
          prazo_alerta?: string | null
          progresso_percentual?: number | null
          proxima_execucao?: string
          recorrencia?: string | null
          status?: string | null
          supermercado_id?: string | null
          template_id?: string | null
          tipo_negocio?: string | null
          titulo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklists_futuros_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_futuros_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_futuros_concluido_por_fkey"
            columns: ["concluido_por"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_futuros_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_futuros_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_futuros_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_checklists_pendentes"
            referencedColumns: ["empresa_id"]
          },
          {
            foreignKeyName: "checklists_futuros_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          ativo: boolean | null
          auth_id: string | null
          cargo: string
          celular: string | null
          created_at: string | null
          email: string
          empresa_id: string | null
          foto_url: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          auth_id?: string | null
          cargo: string
          celular?: string | null
          created_at?: string | null
          email: string
          empresa_id?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          auth_id?: string | null
          cargo?: string
          celular?: string | null
          created_at?: string | null
          email?: string
          empresa_id?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "vw_checklists_pendentes"
            referencedColumns: ["empresa_id"]
          },
        ]
      }
      empresas: {
        Row: {
          aluno_id: number
          ativo: boolean | null
          cidade: string | null
          cnpj: string | null
          created_at: string | null
          endereco: string | null
          estado: string | null
          id: string
          logo_url: string | null
          nome_fantasia: string
          razao_social: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          aluno_id: number
          ativo?: boolean | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          nome_fantasia: string
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          aluno_id?: number
          ativo?: boolean | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          logo_url?: string | null
          nome_fantasia?: string
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      vw_checklists_pendentes: {
        Row: {
          departamento: string | null
          descricao: string | null
          empresa_id: string | null
          empresa_nome: string | null
          id: string | null
          itens_respondidos: number | null
          nome: string | null
          progresso_percentual: number | null
          proxima_execucao: string | null
          status: string | null
          tipo_negocio: string | null
          total_itens: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calcular_progresso_checklist: {
        Args: { checklist_id: string }
        Returns: number
      }
      marcar_checklists_atrasados: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
