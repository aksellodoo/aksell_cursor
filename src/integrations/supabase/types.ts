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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      _new_users_tmp: {
        Row: {
          email: string | null
          id: string | null
        }
        Insert: {
          email?: string | null
          id?: string | null
        }
        Update: {
          email?: string | null
          id?: string | null
        }
        Relationships: []
      }
      _old_users_tmp: {
        Row: {
          email: string | null
          id: string | null
        }
        Insert: {
          email?: string | null
          id?: string | null
        }
        Update: {
          email?: string | null
          id?: string | null
        }
        Relationships: []
      }
      access_rejections: {
        Row: {
          created_at: string
          id: string
          original_request_id: string
          rejected_at: string
          rejected_by: string | null
          rejection_reason: string | null
          requested_department: string
          requested_role: string
          requester_email: string
          requester_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_request_id: string
          rejected_at?: string
          rejected_by?: string | null
          rejection_reason?: string | null
          requested_department: string
          requested_role: string
          requester_email: string
          requester_name: string
        }
        Update: {
          created_at?: string
          id?: string
          original_request_id?: string
          rejected_at?: string
          rejected_by?: string | null
          rejection_reason?: string | null
          requested_department?: string
          requested_role?: string
          requester_email?: string
          requester_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_rejections_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          sources: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          sources?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          conversation_type: Database["public"]["Enums"]["ai_conversation_type"]
          created_at: string
          created_by: string
          id: string
          is_archived: boolean
          scope: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          conversation_type?: Database["public"]["Enums"]["ai_conversation_type"]
          created_at?: string
          created_by: string
          id?: string
          is_archived?: boolean
          scope?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          conversation_type?: Database["public"]["Enums"]["ai_conversation_type"]
          created_at?: string
          created_by?: string
          id?: string
          is_archived?: boolean
          scope?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      api_health_status: {
        Row: {
          consecutive_failures: number | null
          created_at: string
          error_rate_percent: number | null
          id: string
          last_check: string
          last_error_message: string | null
          provider: string
          response_time_ms: number | null
          service: string
          status: string
        }
        Insert: {
          consecutive_failures?: number | null
          created_at?: string
          error_rate_percent?: number | null
          id?: string
          last_check?: string
          last_error_message?: string | null
          provider: string
          response_time_ms?: number | null
          service: string
          status?: string
        }
        Update: {
          consecutive_failures?: number | null
          created_at?: string
          error_rate_percent?: number | null
          id?: string
          last_check?: string
          last_error_message?: string | null
          provider?: string
          response_time_ms?: number | null
          service?: string
          status?: string
        }
        Relationships: []
      }
      app_notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      approval_tokens: {
        Row: {
          access_request_id: string | null
          action: string
          approval_id: string | null
          created_at: string
          created_by: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          access_request_id?: string | null
          action: string
          approval_id?: string | null
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          token_hash: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          access_request_id?: string | null
          action?: string
          approval_id?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      buyer_user_links: {
        Row: {
          buyer_code: string
          created_at: string
          created_by: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          buyer_code: string
          created_at?: string
          created_by: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          buyer_code?: string
          created_at?: string
          created_by?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chatter_email_messages: {
        Row: {
          attachments: Json
          author_id: string | null
          bcc: Json
          cc: Json
          created_at: string
          html: string
          id: string
          message_id: string
          provider_message_id: string | null
          record_id: string
          record_type: string
          sent_at: string
          subject: string
          to: Json
        }
        Insert: {
          attachments?: Json
          author_id?: string | null
          bcc?: Json
          cc?: Json
          created_at?: string
          html: string
          id?: string
          message_id: string
          provider_message_id?: string | null
          record_id: string
          record_type: string
          sent_at?: string
          subject: string
          to?: Json
        }
        Update: {
          attachments?: Json
          author_id?: string | null
          bcc?: Json
          cc?: Json
          created_at?: string
          html?: string
          id?: string
          message_id?: string
          provider_message_id?: string | null
          record_id?: string
          record_type?: string
          sent_at?: string
          subject?: string
          to?: Json
        }
        Relationships: [
          {
            foreignKeyName: "chatter_email_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chatter_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chatter_files: {
        Row: {
          approval_department_id: string | null
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          approval_users: string[] | null
          approved_at: string | null
          approved_by: string | null
          confidentiality_level: Database["public"]["Enums"]["confidentiality_level"]
          created_at: string
          description: string
          document_group_id: string
          effective_date: string | null
          expiry_date: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_current_version: boolean | null
          notify_before_expiry: unknown | null
          notify_department_id: string | null
          notify_users: string[] | null
          record_id: string
          record_type: string
          requires_approval: boolean | null
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
          version_number: number | null
        }
        Insert: {
          approval_department_id?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approval_users?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          confidentiality_level?: Database["public"]["Enums"]["confidentiality_level"]
          created_at?: string
          description?: string
          document_group_id: string
          effective_date?: string | null
          expiry_date?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_current_version?: boolean | null
          notify_before_expiry?: unknown | null
          notify_department_id?: string | null
          notify_users?: string[] | null
          record_id: string
          record_type: string
          requires_approval?: boolean | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          version_number?: number | null
        }
        Update: {
          approval_department_id?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approval_users?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          confidentiality_level?: Database["public"]["Enums"]["confidentiality_level"]
          created_at?: string
          description?: string
          document_group_id?: string
          effective_date?: string | null
          expiry_date?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_current_version?: boolean | null
          notify_before_expiry?: unknown | null
          notify_department_id?: string | null
          notify_users?: string[] | null
          record_id?: string
          record_type?: string
          requires_approval?: boolean | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
          version_number?: number | null
        }
        Relationships: []
      }
      chatter_messages: {
        Row: {
          attachments: Json | null
          author_id: string | null
          created_at: string
          id: string
          is_pinned: boolean
          mentioned_users: string[] | null
          message: string
          message_type: string
          parent_message_id: string | null
          record_id: string
          record_type: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          author_id?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          mentioned_users?: string[] | null
          message: string
          message_type?: string
          parent_message_id?: string | null
          record_id: string
          record_type: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          author_id?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean
          mentioned_users?: string[] | null
          message?: string
          message_type?: string
          parent_message_id?: string | null
          record_id?: string
          record_type?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatter_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatter_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "chatter_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_representatives: {
        Row: {
          company_name: string
          created_at: string
          created_by: string
          id: string
          is_purchases: boolean
          is_registered_in_protheus: boolean
          is_sales: boolean
          notes: string | null
          protheus_table_id: string | null
          supplier_cod: string | null
          supplier_filial: string | null
          supplier_key: string | null
          supplier_loja: string | null
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          created_by: string
          id?: string
          is_purchases?: boolean
          is_registered_in_protheus?: boolean
          is_sales?: boolean
          notes?: string | null
          protheus_table_id?: string | null
          supplier_cod?: string | null
          supplier_filial?: string | null
          supplier_key?: string | null
          supplier_loja?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          created_by?: string
          id?: string
          is_purchases?: boolean
          is_registered_in_protheus?: boolean
          is_sales?: boolean
          notes?: string | null
          protheus_table_id?: string | null
          supplier_cod?: string | null
          supplier_filial?: string | null
          supplier_key?: string | null
          supplier_loja?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_representatives_protheus_table_id_fkey"
            columns: ["protheus_table_id"]
            isOneToOne: false
            referencedRelation: "protheus_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_entities: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          notes: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          notes?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_entity_associations: {
        Row: {
          acronym: string | null
          activity_area: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_street: string | null
          affiliation_date: string | null
          association_type: string | null
          association_validity_date: string | null
          cep: string | null
          city_id: string | null
          cnpj: string | null
          company_relationship_types: string[] | null
          contact_entity_id: string
          contribution_amount: number | null
          contribution_frequency: string | null
          created_at: string
          created_by: string | null
          current_status: string | null
          has_financial_contributions: boolean | null
          id: string
          interaction_history: string | null
          official_name: string
          participation_level: string | null
          regional_unit: string | null
          responsible_department_id: string | null
          responsible_user_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          acronym?: string | null
          activity_area?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          affiliation_date?: string | null
          association_type?: string | null
          association_validity_date?: string | null
          cep?: string | null
          city_id?: string | null
          cnpj?: string | null
          company_relationship_types?: string[] | null
          contact_entity_id: string
          contribution_amount?: number | null
          contribution_frequency?: string | null
          created_at?: string
          created_by?: string | null
          current_status?: string | null
          has_financial_contributions?: boolean | null
          id?: string
          interaction_history?: string | null
          official_name: string
          participation_level?: string | null
          regional_unit?: string | null
          responsible_department_id?: string | null
          responsible_user_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          acronym?: string | null
          activity_area?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          affiliation_date?: string | null
          association_type?: string | null
          association_validity_date?: string | null
          cep?: string | null
          city_id?: string | null
          cnpj?: string | null
          company_relationship_types?: string[] | null
          contact_entity_id?: string
          contribution_amount?: number | null
          contribution_frequency?: string | null
          created_at?: string
          created_by?: string | null
          current_status?: string | null
          has_financial_contributions?: boolean | null
          id?: string
          interaction_history?: string | null
          official_name?: string
          participation_level?: string | null
          regional_unit?: string | null
          responsible_department_id?: string | null
          responsible_user_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_entity_associations_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "site_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_entity_associations_contact_entity_id_fkey"
            columns: ["contact_entity_id"]
            isOneToOne: false
            referencedRelation: "contact_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_entity_associations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_entity_associations_responsible_department_id_fkey"
            columns: ["responsible_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_entity_associations_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_entity_external_partners: {
        Row: {
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_street: string | null
          cep: string | null
          city_id: string | null
          cnpj: string | null
          conflict_observation: string | null
          conflict_of_interest: boolean | null
          contact_entity_id: string
          contact_form_url: string | null
          counterparts: string | null
          created_at: string
          created_by: string | null
          drive_link: string | null
          generic_email: string | null
          id: string
          interest_areas: string[] | null
          internal_areas: string[] | null
          kpis: string | null
          lgpd_basis: Database["public"]["Enums"]["lgpd_basis"] | null
          media_kit_url: string | null
          nda_mou_number: string | null
          nda_mou_term: boolean | null
          nda_mou_url: string | null
          nda_mou_validity: string | null
          official_name: string
          official_profiles: string[] | null
          partner_type: Database["public"]["Enums"]["partner_type"]
          phone: string | null
          relationship_nature: Database["public"]["Enums"]["relationship_nature"][]
          relationship_nature_other: string | null
          relationship_objective: string | null
          relevance: Database["public"]["Enums"]["relevance"] | null
          responsible_department_id: string | null
          responsible_user_id: string | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          status: Database["public"]["Enums"]["partner_status"] | null
          trade_name: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          cep?: string | null
          city_id?: string | null
          cnpj?: string | null
          conflict_observation?: string | null
          conflict_of_interest?: boolean | null
          contact_entity_id: string
          contact_form_url?: string | null
          counterparts?: string | null
          created_at?: string
          created_by?: string | null
          drive_link?: string | null
          generic_email?: string | null
          id?: string
          interest_areas?: string[] | null
          internal_areas?: string[] | null
          kpis?: string | null
          lgpd_basis?: Database["public"]["Enums"]["lgpd_basis"] | null
          media_kit_url?: string | null
          nda_mou_number?: string | null
          nda_mou_term?: boolean | null
          nda_mou_url?: string | null
          nda_mou_validity?: string | null
          official_name: string
          official_profiles?: string[] | null
          partner_type: Database["public"]["Enums"]["partner_type"]
          phone?: string | null
          relationship_nature?: Database["public"]["Enums"]["relationship_nature"][]
          relationship_nature_other?: string | null
          relationship_objective?: string | null
          relevance?: Database["public"]["Enums"]["relevance"] | null
          responsible_department_id?: string | null
          responsible_user_id?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          status?: Database["public"]["Enums"]["partner_status"] | null
          trade_name?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          cep?: string | null
          city_id?: string | null
          cnpj?: string | null
          conflict_observation?: string | null
          conflict_of_interest?: boolean | null
          contact_entity_id?: string
          contact_form_url?: string | null
          counterparts?: string | null
          created_at?: string
          created_by?: string | null
          drive_link?: string | null
          generic_email?: string | null
          id?: string
          interest_areas?: string[] | null
          internal_areas?: string[] | null
          kpis?: string | null
          lgpd_basis?: Database["public"]["Enums"]["lgpd_basis"] | null
          media_kit_url?: string | null
          nda_mou_number?: string | null
          nda_mou_term?: boolean | null
          nda_mou_url?: string | null
          nda_mou_validity?: string | null
          official_name?: string
          official_profiles?: string[] | null
          partner_type?: Database["public"]["Enums"]["partner_type"]
          phone?: string | null
          relationship_nature?: Database["public"]["Enums"]["relationship_nature"][]
          relationship_nature_other?: string | null
          relationship_objective?: string | null
          relevance?: Database["public"]["Enums"]["relevance"] | null
          responsible_department_id?: string | null
          responsible_user_id?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          status?: Database["public"]["Enums"]["partner_status"] | null
          trade_name?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_entity_external_partners_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "site_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_entity_external_partners_contact_entity_id_fkey"
            columns: ["contact_entity_id"]
            isOneToOne: true
            referencedRelation: "contact_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_entity_external_partners_responsible_department_id_fkey"
            columns: ["responsible_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_entity_public_orgs: {
        Row: {
          acronym: string | null
          activity_areas: string[] | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_street: string | null
          cep: string | null
          city_id: string | null
          cnpj: string | null
          contact_entity_id: string
          created_at: string
          created_by: string | null
          governmental_sphere: string | null
          id: string
          official_name: string
          organ_type: string | null
          regional_unit: string | null
          relation_detail: string | null
          relation_type: string | null
          responsible_department_id: string | null
          responsible_user_id: string | null
          status: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          acronym?: string | null
          activity_areas?: string[] | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          cep?: string | null
          city_id?: string | null
          cnpj?: string | null
          contact_entity_id: string
          created_at?: string
          created_by?: string | null
          governmental_sphere?: string | null
          id?: string
          official_name: string
          organ_type?: string | null
          regional_unit?: string | null
          relation_detail?: string | null
          relation_type?: string | null
          responsible_department_id?: string | null
          responsible_user_id?: string | null
          status?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          acronym?: string | null
          activity_areas?: string[] | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          cep?: string | null
          city_id?: string | null
          cnpj?: string | null
          contact_entity_id?: string
          created_at?: string
          created_by?: string | null
          governmental_sphere?: string | null
          id?: string
          official_name?: string
          organ_type?: string | null
          regional_unit?: string | null
          relation_detail?: string | null
          relation_type?: string | null
          responsible_department_id?: string | null
          responsible_user_id?: string | null
          status?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_entity_public_orgs_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "site_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_entity_public_orgs_contact_entity_id_fkey"
            columns: ["contact_entity_id"]
            isOneToOne: true
            referencedRelation: "contact_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_entity_public_orgs_responsible_department_id_fkey"
            columns: ["responsible_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_entity_public_orgs_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_entity_tags: {
        Row: {
          created_at: string
          created_by: string | null
          entity_id: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_id: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_entity_tags_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "contact_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_entity_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "email_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_friend_family_link_employees: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          link_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          link_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          link_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_friend_family_link_employees_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "contact_friend_family_links"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_friend_family_links: {
        Row: {
          conflict_notes: string | null
          consent_date: string | null
          contact_id: string
          contact_restrictions: string | null
          created_at: string
          created_by: string
          dnc_list: boolean
          has_consent: boolean
          id: string
          is_minor: boolean
          legal_basis: Database["public"]["Enums"]["lgpd_legal_basis"]
          legal_guardian_contact: string | null
          legal_guardian_name: string | null
          relationship: Database["public"]["Enums"]["family_relationship"]
          relationship_other: string | null
          updated_at: string
          usage_other: string | null
          usage_types: Database["public"]["Enums"]["contact_usage_type"][]
        }
        Insert: {
          conflict_notes?: string | null
          consent_date?: string | null
          contact_id: string
          contact_restrictions?: string | null
          created_at?: string
          created_by?: string
          dnc_list?: boolean
          has_consent?: boolean
          id?: string
          is_minor?: boolean
          legal_basis: Database["public"]["Enums"]["lgpd_legal_basis"]
          legal_guardian_contact?: string | null
          legal_guardian_name?: string | null
          relationship: Database["public"]["Enums"]["family_relationship"]
          relationship_other?: string | null
          updated_at?: string
          usage_other?: string | null
          usage_types?: Database["public"]["Enums"]["contact_usage_type"][]
        }
        Update: {
          conflict_notes?: string | null
          consent_date?: string | null
          contact_id?: string
          contact_restrictions?: string | null
          created_at?: string
          created_by?: string
          dnc_list?: boolean
          has_consent?: boolean
          id?: string
          is_minor?: boolean
          legal_basis?: Database["public"]["Enums"]["lgpd_legal_basis"]
          legal_guardian_contact?: string | null
          legal_guardian_name?: string | null
          relationship?: Database["public"]["Enums"]["family_relationship"]
          relationship_other?: string | null
          updated_at?: string
          usage_other?: string | null
          usage_types?: Database["public"]["Enums"]["contact_usage_type"][]
        }
        Relationships: []
      }
      contact_links: {
        Row: {
          contact_id: string
          created_at: string
          created_by: string
          id: string
          link_type: Database["public"]["Enums"]["contact_link_type"]
          target_id: string
          target_kind: Database["public"]["Enums"]["contact_link_target_kind"]
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          created_by?: string
          id?: string
          link_type: Database["public"]["Enums"]["contact_link_type"]
          target_id: string
          target_kind?: Database["public"]["Enums"]["contact_link_target_kind"]
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          created_by?: string
          id?: string
          link_type?: Database["public"]["Enums"]["contact_link_type"]
          target_id?: string
          target_kind?: Database["public"]["Enums"]["contact_link_target_kind"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_links_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_partner_projects: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          partner_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          partner_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          partner_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_partner_projects_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "contact_entity_external_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_street: string | null
          cep: string | null
          city_id: string | null
          created_at: string
          created_by: string
          custom_treatment: string | null
          decision_level:
            | Database["public"]["Enums"]["contact_decision_level"]
            | null
          department: string | null
          email_primary: string | null
          id: string
          job_title: string | null
          landline_phone: string | null
          linkedin_url: string | null
          messaging_phone: string | null
          messaging_telegram: boolean
          messaging_whatsapp: boolean
          mobile_phone: string | null
          name: string
          responsible_department_id: string | null
          responsible_user_id: string | null
          treatment_type: Database["public"]["Enums"]["contact_treatment"]
          updated_at: string
        }
        Insert: {
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          cep?: string | null
          city_id?: string | null
          created_at?: string
          created_by: string
          custom_treatment?: string | null
          decision_level?:
            | Database["public"]["Enums"]["contact_decision_level"]
            | null
          department?: string | null
          email_primary?: string | null
          id?: string
          job_title?: string | null
          landline_phone?: string | null
          linkedin_url?: string | null
          messaging_phone?: string | null
          messaging_telegram?: boolean
          messaging_whatsapp?: boolean
          mobile_phone?: string | null
          name: string
          responsible_department_id?: string | null
          responsible_user_id?: string | null
          treatment_type?: Database["public"]["Enums"]["contact_treatment"]
          updated_at?: string
        }
        Update: {
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          cep?: string | null
          city_id?: string | null
          created_at?: string
          created_by?: string
          custom_treatment?: string | null
          decision_level?:
            | Database["public"]["Enums"]["contact_decision_level"]
            | null
          department?: string | null
          email_primary?: string | null
          id?: string
          job_title?: string | null
          landline_phone?: string | null
          linkedin_url?: string | null
          messaging_phone?: string | null
          messaging_telegram?: boolean
          messaging_whatsapp?: boolean
          mobile_phone?: string | null
          name?: string
          responsible_department_id?: string | null
          responsible_user_id?: string | null
          treatment_type?: Database["public"]["Enums"]["contact_treatment"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_city_fk"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "site_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_responsible_department_fk"
            columns: ["responsible_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_responsible_user_fk"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_job_logs: {
        Row: {
          details: Json | null
          executed_at: string | null
          id: string
          job_name: string
          status: string | null
        }
        Insert: {
          details?: Json | null
          executed_at?: string | null
          id?: string
          job_name: string
          status?: string | null
        }
        Update: {
          details?: Json | null
          executed_at?: string | null
          id?: string
          job_name?: string
          status?: string | null
        }
        Relationships: []
      }
      department_permissions: {
        Row: {
          admin_permission:
            | Database["public"]["Enums"]["permission_level"]
            | null
          created_at: string
          department_id: string
          director_permission:
            | Database["public"]["Enums"]["permission_level"]
            | null
          hr_permission: Database["public"]["Enums"]["permission_level"] | null
          id: string
          leader_permission:
            | Database["public"]["Enums"]["permission_level"]
            | null
          page_name: string
          updated_at: string
          user_permission:
            | Database["public"]["Enums"]["permission_level"]
            | null
        }
        Insert: {
          admin_permission?:
            | Database["public"]["Enums"]["permission_level"]
            | null
          created_at?: string
          department_id: string
          director_permission?:
            | Database["public"]["Enums"]["permission_level"]
            | null
          hr_permission?: Database["public"]["Enums"]["permission_level"] | null
          id?: string
          leader_permission?:
            | Database["public"]["Enums"]["permission_level"]
            | null
          page_name: string
          updated_at?: string
          user_permission?:
            | Database["public"]["Enums"]["permission_level"]
            | null
        }
        Update: {
          admin_permission?:
            | Database["public"]["Enums"]["permission_level"]
            | null
          created_at?: string
          department_id?: string
          director_permission?:
            | Database["public"]["Enums"]["permission_level"]
            | null
          hr_permission?: Database["public"]["Enums"]["permission_level"] | null
          id?: string
          leader_permission?:
            | Database["public"]["Enums"]["permission_level"]
            | null
          page_name?: string
          updated_at?: string
          user_permission?:
            | Database["public"]["Enums"]["permission_level"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "department_permissions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          color: string
          created_at: string
          description: string | null
          document_root_enabled: boolean
          document_root_folder_id: string | null
          id: string
          integrates_org_chart: boolean
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          document_root_enabled?: boolean
          document_root_folder_id?: string | null
          id?: string
          integrates_org_chart?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          document_root_enabled?: boolean
          document_root_folder_id?: string | null
          id?: string
          integrates_org_chart?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_document_root_folder_id_fkey"
            columns: ["document_root_folder_id"]
            isOneToOne: false
            referencedRelation: "folder_descendant_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_document_root_folder_id_fkey"
            columns: ["document_root_folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_chunks: {
        Row: {
          acl_hash: string
          bbox_coordinates: Json | null
          change_analysis: string | null
          chunk_index: number
          confidence_score: number | null
          content: string
          created_at: string
          document_id: string
          embedding: string
          embedding_type: string | null
          extracted_objects: string[] | null
          extraction_source: string | null
          has_image_analysis: boolean | null
          id: string
          lang: string | null
          modality: string
          page_number: number | null
          parent_structure_id: string | null
          section: string | null
          semantic_description: string | null
          slide_number: number | null
          source: string | null
          structure_type: string | null
          table_metadata: Json | null
          tokens: number | null
          word_count: number | null
        }
        Insert: {
          acl_hash: string
          bbox_coordinates?: Json | null
          change_analysis?: string | null
          chunk_index: number
          confidence_score?: number | null
          content: string
          created_at?: string
          document_id: string
          embedding: string
          embedding_type?: string | null
          extracted_objects?: string[] | null
          extraction_source?: string | null
          has_image_analysis?: boolean | null
          id?: string
          lang?: string | null
          modality?: string
          page_number?: number | null
          parent_structure_id?: string | null
          section?: string | null
          semantic_description?: string | null
          slide_number?: number | null
          source?: string | null
          structure_type?: string | null
          table_metadata?: Json | null
          tokens?: number | null
          word_count?: number | null
        }
        Update: {
          acl_hash?: string
          bbox_coordinates?: Json | null
          change_analysis?: string | null
          chunk_index?: number
          confidence_score?: number | null
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string
          embedding_type?: string | null
          extracted_objects?: string[] | null
          extraction_source?: string | null
          has_image_analysis?: boolean | null
          id?: string
          lang?: string | null
          modality?: string
          page_number?: number | null
          parent_structure_id?: string | null
          section?: string | null
          semantic_description?: string | null
          slide_number?: number | null
          source?: string | null
          structure_type?: string | null
          table_metadata?: Json | null
          tokens?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doc_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_doc_chunks_document"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_access_logs: {
        Row: {
          access_type: string
          created_at: string
          document_id: string
          folder_id: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_type: string
          created_at?: string
          document_id: string
          folder_id: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_type?: string
          created_at?: string
          document_id?: string
          folder_id?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_document_access_logs_document_id"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_document_access_logs_folder_id"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folder_descendant_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_document_access_logs_folder_id"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      document_version_chunks: {
        Row: {
          chunk_index: number
          chunk_type: string | null
          content: string
          created_at: string
          embeddings: string | null
          id: string
          section: string | null
          version_id: string
        }
        Insert: {
          chunk_index: number
          chunk_type?: string | null
          content: string
          created_at?: string
          embeddings?: string | null
          id?: string
          section?: string | null
          version_id: string
        }
        Update: {
          chunk_index?: number
          chunk_type?: string | null
          content?: string
          created_at?: string
          embeddings?: string | null
          id?: string
          section?: string | null
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_version_chunks_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          chunk_count: number | null
          created_at: string
          created_by: string | null
          document_id: string
          file_size: number | null
          id: string
          mime_type: string | null
          rag_summary: string | null
          status: string | null
          storage_key: string | null
          version_number: number
        }
        Insert: {
          chunk_count?: number | null
          created_at?: string
          created_by?: string | null
          document_id: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          rag_summary?: string | null
          status?: string | null
          storage_key?: string | null
          version_number: number
        }
        Update: {
          chunk_count?: number | null
          created_at?: string
          created_by?: string | null
          document_id?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          rag_summary?: string | null
          status?: string | null
          storage_key?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          acl_hash: string | null
          approval_mode: string | null
          approvers: string[] | null
          created_at: string
          created_by: string | null
          department_id: string
          description: string | null
          effective_date: string | null
          error_message: string | null
          expiry_date: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          folder_id: string
          id: string
          mime_type: string | null
          name: string
          notify_before_expiry_days: number | null
          page_count: number | null
          pending_type: string | null
          processed_at: string | null
          processing_auto_detect_language: boolean | null
          processing_custom_language: string | null
          rag_status: string | null
          rejection_reason: string | null
          replacement_document_id: string | null
          review_department_id: string | null
          reviewers: string[] | null
          status: string | null
          storage_key: string | null
          updated_at: string
          version_notes: string | null
          version_number: number | null
        }
        Insert: {
          acl_hash?: string | null
          approval_mode?: string | null
          approvers?: string[] | null
          created_at?: string
          created_by?: string | null
          department_id: string
          description?: string | null
          effective_date?: string | null
          error_message?: string | null
          expiry_date?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          folder_id: string
          id?: string
          mime_type?: string | null
          name: string
          notify_before_expiry_days?: number | null
          page_count?: number | null
          pending_type?: string | null
          processed_at?: string | null
          processing_auto_detect_language?: boolean | null
          processing_custom_language?: string | null
          rag_status?: string | null
          rejection_reason?: string | null
          replacement_document_id?: string | null
          review_department_id?: string | null
          reviewers?: string[] | null
          status?: string | null
          storage_key?: string | null
          updated_at?: string
          version_notes?: string | null
          version_number?: number | null
        }
        Update: {
          acl_hash?: string | null
          approval_mode?: string | null
          approvers?: string[] | null
          created_at?: string
          created_by?: string | null
          department_id?: string
          description?: string | null
          effective_date?: string | null
          error_message?: string | null
          expiry_date?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          folder_id?: string
          id?: string
          mime_type?: string | null
          name?: string
          notify_before_expiry_days?: number | null
          page_count?: number | null
          pending_type?: string | null
          processed_at?: string | null
          processing_auto_detect_language?: boolean | null
          processing_custom_language?: string | null
          rag_status?: string | null
          rejection_reason?: string | null
          replacement_document_id?: string | null
          review_department_id?: string | null
          reviewers?: string[] | null
          status?: string | null
          storage_key?: string | null
          updated_at?: string
          version_notes?: string | null
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folder_descendant_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_replacement_document_id_fkey"
            columns: ["replacement_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_review_department_id_fkey"
            columns: ["review_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      economic_group_segments_map: {
        Row: {
          created_at: string
          created_by: string
          group_id: number
          id: string
          segment_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          group_id: number
          id?: string
          segment_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          group_id?: number
          id?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "economic_group_segments_map_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "protheus_customer_groups"
            referencedColumns: ["id_grupo"]
          },
          {
            foreignKeyName: "economic_group_segments_map_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "site_product_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      email_draft_shares: {
        Row: {
          created_at: string
          draft_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          draft_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          draft_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_draft_shares_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "email_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_draft_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_draft_tags: {
        Row: {
          created_at: string
          draft_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          draft_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          draft_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_draft_tags_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "email_drafts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_draft_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "email_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      email_drafts: {
        Row: {
          attachments: Json
          bcc_recipients: Json
          cc_recipients: Json
          created_at: string
          html: string | null
          id: string
          owner_id: string
          subject: string | null
          to_recipients: Json
          updated_at: string
        }
        Insert: {
          attachments?: Json
          bcc_recipients?: Json
          cc_recipients?: Json
          created_at?: string
          html?: string | null
          id?: string
          owner_id: string
          subject?: string | null
          to_recipients?: Json
          updated_at?: string
        }
        Update: {
          attachments?: Json
          bcc_recipients?: Json
          cc_recipients?: Json
          created_at?: string
          html?: string | null
          id?: string
          owner_id?: string
          subject?: string | null
          to_recipients?: Json
          updated_at?: string
        }
        Relationships: []
      }
      email_signature_targets: {
        Row: {
          created_at: string
          id: string
          microsoft_account_id: string | null
          shared_mailbox_id: string | null
          signature_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          microsoft_account_id?: string | null
          shared_mailbox_id?: string | null
          signature_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          microsoft_account_id?: string | null
          shared_mailbox_id?: string | null
          signature_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_signature_targets_microsoft_account_id_fkey"
            columns: ["microsoft_account_id"]
            isOneToOne: false
            referencedRelation: "microsoft_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_signature_targets_shared_mailbox_id_fkey"
            columns: ["shared_mailbox_id"]
            isOneToOne: false
            referencedRelation: "microsoft_shared_mailboxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_signature_targets_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "email_signatures"
            referencedColumns: ["id"]
          },
        ]
      }
      email_signatures: {
        Row: {
          created_at: string
          html: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          html?: string
          id?: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          html?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_tags: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          document_type: string
          employee_id: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          document_type: string
          employee_id: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          document_type?: string
          employee_id?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          birth_date: string | null
          contract_type: Database["public"]["Enums"]["contract_type"] | null
          cpf: string
          created_at: string
          department_id: string | null
          email: string | null
          employee_code: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          hire_date: string
          id: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          position: string
          rg: string | null
          salary: number | null
          status: Database["public"]["Enums"]["employee_status"] | null
          supervisor_id: string | null
          termination_date: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"] | null
          cpf: string
          created_at?: string
          department_id?: string | null
          email?: string | null
          employee_code: string
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          hire_date: string
          id?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          position: string
          rg?: string | null
          salary?: number | null
          status?: Database["public"]["Enums"]["employee_status"] | null
          supervisor_id?: string | null
          termination_date?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"] | null
          cpf?: string
          created_at?: string
          department_id?: string | null
          email?: string | null
          employee_code?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          hire_date?: string
          id?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          position?: string
          rg?: string | null
          salary?: number | null
          status?: Database["public"]["Enums"]["employee_status"] | null
          supervisor_id?: string | null
          termination_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      field_audit_log: {
        Row: {
          changed_by: string | null
          created_at: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          record_id: string
          record_type: string
          timestamp: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          record_id: string
          record_type?: string
          timestamp?: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          record_id?: string
          record_type?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string
          id: string
          is_root: boolean
          name: string
          order_index: number | null
          parent_folder_id: string | null
          status: Database["public"]["Enums"]["folder_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id: string
          id?: string
          is_root?: boolean
          name: string
          order_index?: number | null
          parent_folder_id?: string | null
          status?: Database["public"]["Enums"]["folder_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string
          id?: string
          is_root?: boolean
          name?: string
          order_index?: number | null
          parent_folder_id?: string | null
          status?: Database["public"]["Enums"]["folder_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "folder_descendant_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      form_analytics: {
        Row: {
          event_data: Json
          event_type: string
          form_id: string
          id: string
          occurred_at: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          event_data?: Json
          event_type: string
          form_id: string
          id?: string
          occurred_at?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          event_data?: Json
          event_type?: string
          form_id?: string
          id?: string
          occurred_at?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_form_analytics_form_id"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_external_login_attempts: {
        Row: {
          attempted_at: string
          email_lower: string
          form_id: string | null
          id: string
          ip_hash: string
          success: boolean
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string
          email_lower: string
          form_id?: string | null
          id?: string
          ip_hash: string
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string
          email_lower?: string
          form_id?: string | null
          id?: string
          ip_hash?: string
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      form_external_recipients: {
        Row: {
          access_count: number | null
          created_at: string
          email: string
          form_id: string
          id: string
          is_active: boolean | null
          last_access: string | null
          name: string
          password_hash: string | null
        }
        Insert: {
          access_count?: number | null
          created_at?: string
          email: string
          form_id: string
          id?: string
          is_active?: boolean | null
          last_access?: string | null
          name: string
          password_hash?: string | null
        }
        Update: {
          access_count?: number | null
          created_at?: string
          email?: string
          form_id?: string
          id?: string
          is_active?: boolean | null
          last_access?: string | null
          name?: string
          password_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_external_recipients_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_external_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean | null
          recipient_id: string
          session_token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean | null
          recipient_id: string
          session_token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean | null
          recipient_id?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_external_sessions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "form_external_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      form_publication_tokens: {
        Row: {
          access_count: number | null
          created_at: string
          created_by: string
          expires_at: string | null
          form_id: string
          id: string
          is_active: boolean
          max_access_count: number | null
          metadata: Json | null
          token_hash: string
          token_type: string
        }
        Insert: {
          access_count?: number | null
          created_at?: string
          created_by: string
          expires_at?: string | null
          form_id: string
          id?: string
          is_active?: boolean
          max_access_count?: number | null
          metadata?: Json | null
          token_hash: string
          token_type?: string
        }
        Update: {
          access_count?: number | null
          created_at?: string
          created_by?: string
          expires_at?: string | null
          form_id?: string
          id?: string
          is_active?: boolean
          max_access_count?: number | null
          metadata?: Json | null
          token_hash?: string
          token_type?: string
        }
        Relationships: []
      }
      form_response_drafts: {
        Row: {
          created_at: string
          form_id: string
          id: string
          progress_percent: number
          response_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          form_id: string
          id?: string
          progress_percent?: number
          response_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          form_id?: string
          id?: string
          progress_percent?: number
          response_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_response_drafts_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_response_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      form_responses: {
        Row: {
          form_id: string
          id: string
          ip_address: unknown | null
          metadata: Json
          response_data: Json
          submitted_at: string
          submitted_by: string | null
          user_agent: string | null
        }
        Insert: {
          form_id: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json
          response_data?: Json
          submitted_at?: string
          submitted_by?: string | null
          user_agent?: string | null
        }
        Update: {
          form_id?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json
          response_data?: Json
          submitted_at?: string
          submitted_by?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_form_responses_form_id"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_versions: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          fields_definition: Json
          form_id: string
          id: string
          is_current: boolean | null
          response_count: number | null
          settings: Json
          title: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          fields_definition?: Json
          form_id: string
          id?: string
          is_current?: boolean | null
          response_count?: number | null
          settings?: Json
          title: string
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          fields_definition?: Json
          form_id?: string
          id?: string
          is_current?: boolean | null
          response_count?: number | null
          settings?: Json
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "form_versions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          allow_anonymous: boolean
          allowed_departments: string[] | null
          allowed_roles: string[] | null
          allowed_users: string[] | null
          allows_anonymous_responses: boolean | null
          confidentiality_level: Database["public"]["Enums"]["confidentiality_level"]
          created_at: string
          created_by: string
          description: string | null
          fields_definition: Json
          has_responses: boolean | null
          id: string
          internal_recipients: Json | null
          is_public: boolean
          is_published: boolean | null
          parent_form_id: string | null
          publication_links: Json | null
          publication_settings: Json | null
          publication_status: string
          published_at: string | null
          settings: Json
          share_settings: Json
          status: string
          title: string
          updated_at: string
          version_number: number | null
        }
        Insert: {
          allow_anonymous?: boolean
          allowed_departments?: string[] | null
          allowed_roles?: string[] | null
          allowed_users?: string[] | null
          allows_anonymous_responses?: boolean | null
          confidentiality_level?: Database["public"]["Enums"]["confidentiality_level"]
          created_at?: string
          created_by: string
          description?: string | null
          fields_definition?: Json
          has_responses?: boolean | null
          id?: string
          internal_recipients?: Json | null
          is_public?: boolean
          is_published?: boolean | null
          parent_form_id?: string | null
          publication_links?: Json | null
          publication_settings?: Json | null
          publication_status?: string
          published_at?: string | null
          settings?: Json
          share_settings?: Json
          status?: string
          title: string
          updated_at?: string
          version_number?: number | null
        }
        Update: {
          allow_anonymous?: boolean
          allowed_departments?: string[] | null
          allowed_roles?: string[] | null
          allowed_users?: string[] | null
          allows_anonymous_responses?: boolean | null
          confidentiality_level?: Database["public"]["Enums"]["confidentiality_level"]
          created_at?: string
          created_by?: string
          description?: string | null
          fields_definition?: Json
          has_responses?: boolean | null
          id?: string
          internal_recipients?: Json | null
          is_public?: boolean
          is_published?: boolean | null
          parent_form_id?: string | null
          publication_links?: Json | null
          publication_settings?: Json | null
          publication_status?: string
          published_at?: string | null
          settings?: Json
          share_settings?: Json
          status?: string
          title?: string
          updated_at?: string
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forms_parent_form_id_fkey"
            columns: ["parent_form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      microsoft_accounts: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          ms_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          ms_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          ms_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      microsoft_shared_mailboxes: {
        Row: {
          created_at: string
          display_name: string
          email: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ms_oauth_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          microsoft_account_id: string
          refresh_token: string
          scope: string | null
          token_type: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          microsoft_account_id: string
          refresh_token: string
          scope?: string | null
          token_type?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          microsoft_account_id?: string
          refresh_token?: string
          scope?: string | null
          token_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ms_oauth_tokens_microsoft_account_id_fkey"
            columns: ["microsoft_account_id"]
            isOneToOne: false
            referencedRelation: "microsoft_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          channels_used: Json
          id: string
          notification_data: Json
          protheus_table_name: string
          record_id: string
          record_status: string
          sent_at: string | null
          user_id: string
        }
        Insert: {
          channels_used: Json
          id?: string
          notification_data: Json
          protheus_table_name: string
          record_id: string
          record_status: string
          sent_at?: string | null
          user_id: string
        }
        Update: {
          channels_used?: Json
          id?: string
          notification_data?: Json
          protheus_table_name?: string
          record_id?: string
          record_status?: string
          sent_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ocr_cache: {
        Row: {
          cache_key: string
          created_at: string
          data: Json
          expires_at: string
          id: string
          updated_at: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          data: Json
          expires_at: string
          id?: string
          updated_at?: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ocr_metrics: {
        Row: {
          cost_estimate: number | null
          created_at: string
          document_id: string | null
          fallback_reason: string | null
          id: string
          model_used: string
          page_number: number
          processing_time_ms: number | null
          quality_score: number | null
          retry_count: number | null
        }
        Insert: {
          cost_estimate?: number | null
          created_at?: string
          document_id?: string | null
          fallback_reason?: string | null
          id?: string
          model_used: string
          page_number: number
          processing_time_ms?: number | null
          quality_score?: number | null
          retry_count?: number | null
        }
        Update: {
          cost_estimate?: number | null
          created_at?: string
          document_id?: string | null
          fallback_reason?: string | null
          id?: string
          model_used?: string
          page_number?: number
          processing_time_ms?: number | null
          quality_score?: number | null
          retry_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ocr_metrics_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          reset_type: string
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          reset_type?: string
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          reset_type?: string
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pending_access_requests: {
        Row: {
          created_at: string
          department: string
          department_id: string | null
          email: string
          expires_at: string
          id: string
          is_leader: boolean
          name: string
          notification_app: boolean
          notification_email: boolean
          notification_frequency: string
          rejection_reason: string | null
          request_ip_hash: string | null
          request_user_agent: string | null
          role: string
          status: string
          supervisor_id: string | null
          workflow_execution_id: string | null
        }
        Insert: {
          created_at?: string
          department: string
          department_id?: string | null
          email: string
          expires_at?: string
          id?: string
          is_leader?: boolean
          name: string
          notification_app?: boolean
          notification_email?: boolean
          notification_frequency?: string
          rejection_reason?: string | null
          request_ip_hash?: string | null
          request_user_agent?: string | null
          role?: string
          status?: string
          supervisor_id?: string | null
          workflow_execution_id?: string | null
        }
        Update: {
          created_at?: string
          department?: string
          department_id?: string | null
          email?: string
          expires_at?: string
          id?: string
          is_leader?: boolean
          name?: string
          notification_app?: boolean
          notification_email?: boolean
          notification_frequency?: string
          rejection_reason?: string | null
          request_ip_hash?: string | null
          request_user_agent?: string | null
          role?: string
          status?: string
          supervisor_id?: string | null
          workflow_execution_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_access_requests_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_users: {
        Row: {
          created_at: string
          created_by: string
          email: string
          id: string
          is_active: boolean
          name: string
          portal_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          portal_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          portal_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_users_portal_id_fkey"
            columns: ["portal_id"]
            isOneToOne: false
            referencedRelation: "portals"
            referencedColumns: ["id"]
          },
        ]
      }
      portals: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          stakeholder: Database["public"]["Enums"]["portal_stakeholder"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          stakeholder: Database["public"]["Enums"]["portal_stakeholder"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          stakeholder?: Database["public"]["Enums"]["portal_stakeholder"]
          updated_at?: string
        }
        Relationships: []
      }
      processing_cache: {
        Row: {
          access_count: number
          api_provider: string | null
          cache_key: string
          cache_type: string
          cached_data: Json
          content_hash: string
          created_at: string
          expires_at: string
          file_size: number | null
          id: string
          last_accessed: string
          page_number: number | null
        }
        Insert: {
          access_count?: number
          api_provider?: string | null
          cache_key: string
          cache_type?: string
          cached_data: Json
          content_hash: string
          created_at?: string
          expires_at?: string
          file_size?: number | null
          id?: string
          last_accessed?: string
          page_number?: number | null
        }
        Update: {
          access_count?: number
          api_provider?: string | null
          cache_key?: string
          cache_type?: string
          cached_data?: Json
          content_hash?: string
          created_at?: string
          expires_at?: string
          file_size?: number | null
          id?: string
          last_accessed?: string
          page_number?: number | null
        }
        Relationships: []
      }
      processing_performance_metrics: {
        Row: {
          adaptive_dpi_used: number | null
          api_calls_made: Json | null
          cache_hits: number | null
          cache_misses: number | null
          created_at: string
          document_id: string | null
          early_stopping_triggered: boolean | null
          embedding_time_ms: number | null
          estimated_cost_usd: number | null
          file_name: string
          file_size: number
          id: string
          ocr_confidence_avg: number | null
          ocr_processing_time_ms: number | null
          overall_quality_score: number | null
          pages_native_text: number | null
          pages_requiring_ocr: number | null
          processing_mode: string | null
          processing_session_id: string
          text_extraction_time_ms: number | null
          total_pages: number | null
          total_processing_time_ms: number | null
        }
        Insert: {
          adaptive_dpi_used?: number | null
          api_calls_made?: Json | null
          cache_hits?: number | null
          cache_misses?: number | null
          created_at?: string
          document_id?: string | null
          early_stopping_triggered?: boolean | null
          embedding_time_ms?: number | null
          estimated_cost_usd?: number | null
          file_name: string
          file_size: number
          id?: string
          ocr_confidence_avg?: number | null
          ocr_processing_time_ms?: number | null
          overall_quality_score?: number | null
          pages_native_text?: number | null
          pages_requiring_ocr?: number | null
          processing_mode?: string | null
          processing_session_id: string
          text_extraction_time_ms?: number | null
          total_pages?: number | null
          total_processing_time_ms?: number | null
        }
        Update: {
          adaptive_dpi_used?: number | null
          api_calls_made?: Json | null
          cache_hits?: number | null
          cache_misses?: number | null
          created_at?: string
          document_id?: string | null
          early_stopping_triggered?: boolean | null
          embedding_time_ms?: number | null
          estimated_cost_usd?: number | null
          file_name?: string
          file_size?: number
          id?: string
          ocr_confidence_avg?: number | null
          ocr_processing_time_ms?: number | null
          overall_quality_score?: number | null
          pages_native_text?: number | null
          pages_requiring_ocr?: number | null
          processing_mode?: string | null
          processing_session_id?: string
          text_extraction_time_ms?: number | null
          total_pages?: number | null
          total_processing_time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "processing_performance_metrics_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_steps: {
        Row: {
          created_at: string
          document_id: string
          id: string
          message: string | null
          progress: number
          status: string
          step_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          message?: string | null
          progress?: number
          status: string
          step_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          message?: string | null
          progress?: number
          status?: string
          step_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          can_change_password: boolean
          company_relationship: string | null
          created_at: string
          created_by: string | null
          department: string
          department_id: string | null
          email: string
          employee_id: string | null
          id: string
          is_leader: boolean
          last_login: string | null
          max_trusted_devices: number | null
          mfa_enforced_at: string | null
          mfa_last_verified_at: string | null
          mfa_required: boolean
          name: string
          notification_app: boolean
          notification_email: boolean
          notification_frequency: string
          notification_telegram: boolean
          notification_types: Json
          notification_whatsapp: boolean | null
          role: string
          status: string
          supervisor_id: string | null
          telegram_chat_id: string | null
          telegram_setup_code: string | null
          telegram_setup_code_expires_at: string | null
          telegram_username: string | null
          trust_device_duration: number | null
          updated_at: string
          whatsapp_chat_id: string | null
          whatsapp_phone: string | null
          whatsapp_verification_code: string | null
          whatsapp_verification_expires_at: string | null
          whatsapp_verified: boolean | null
        }
        Insert: {
          can_change_password?: boolean
          company_relationship?: string | null
          created_at?: string
          created_by?: string | null
          department: string
          department_id?: string | null
          email: string
          employee_id?: string | null
          id: string
          is_leader?: boolean
          last_login?: string | null
          max_trusted_devices?: number | null
          mfa_enforced_at?: string | null
          mfa_last_verified_at?: string | null
          mfa_required?: boolean
          name: string
          notification_app?: boolean
          notification_email?: boolean
          notification_frequency?: string
          notification_telegram?: boolean
          notification_types?: Json
          notification_whatsapp?: boolean | null
          role?: string
          status?: string
          supervisor_id?: string | null
          telegram_chat_id?: string | null
          telegram_setup_code?: string | null
          telegram_setup_code_expires_at?: string | null
          telegram_username?: string | null
          trust_device_duration?: number | null
          updated_at?: string
          whatsapp_chat_id?: string | null
          whatsapp_phone?: string | null
          whatsapp_verification_code?: string | null
          whatsapp_verification_expires_at?: string | null
          whatsapp_verified?: boolean | null
        }
        Update: {
          can_change_password?: boolean
          company_relationship?: string | null
          created_at?: string
          created_by?: string | null
          department?: string
          department_id?: string | null
          email?: string
          employee_id?: string | null
          id?: string
          is_leader?: boolean
          last_login?: string | null
          max_trusted_devices?: number | null
          mfa_enforced_at?: string | null
          mfa_last_verified_at?: string | null
          mfa_required?: boolean
          name?: string
          notification_app?: boolean
          notification_email?: boolean
          notification_frequency?: string
          notification_telegram?: boolean
          notification_types?: Json
          notification_whatsapp?: boolean | null
          role?: string
          status?: string
          supervisor_id?: string | null
          telegram_chat_id?: string | null
          telegram_setup_code?: string | null
          telegram_setup_code_expires_at?: string | null
          telegram_username?: string | null
          trust_device_duration?: number | null
          updated_at?: string
          whatsapp_chat_id?: string | null
          whatsapp_phone?: string | null
          whatsapp_verification_code?: string | null
          whatsapp_verification_expires_at?: string | null
          whatsapp_verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      protheus_binary_assets: {
        Row: {
          created_at: string | null
          downloaded_at: string | null
          field_name: string
          id: string
          mime_type: string | null
          protheus_id: string
          protheus_table_id: string
          sha256: string | null
          size_bytes: number | null
          storage_bucket: string
          storage_path: string
          supabase_table_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          downloaded_at?: string | null
          field_name: string
          id?: string
          mime_type?: string | null
          protheus_id: string
          protheus_table_id: string
          sha256?: string | null
          size_bytes?: number | null
          storage_bucket?: string
          storage_path: string
          supabase_table_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          downloaded_at?: string | null
          field_name?: string
          id?: string
          mime_type?: string | null
          protheus_id?: string
          protheus_table_id?: string
          sha256?: string | null
          size_bytes?: number | null
          storage_bucket?: string
          storage_path?: string
          supabase_table_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "protheus_binary_assets_protheus_table_id_fkey"
            columns: ["protheus_table_id"]
            isOneToOne: false
            referencedRelation: "protheus_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      protheus_config: {
        Row: {
          aksell_config: Json
          connection_type: string
          created_at: string
          endpoints_documentation: Json | null
          id: string
          is_active: boolean
          oracle_proxy_code: string | null
          oracle_schema: string | null
          totvs_config: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          aksell_config?: Json
          connection_type?: string
          created_at?: string
          endpoints_documentation?: Json | null
          id?: string
          is_active?: boolean
          oracle_proxy_code?: string | null
          oracle_schema?: string | null
          totvs_config?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          aksell_config?: Json
          connection_type?: string
          created_at?: string
          endpoints_documentation?: Json | null
          id?: string
          is_active?: boolean
          oracle_proxy_code?: string | null
          oracle_schema?: string | null
          totvs_config?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protheus_config_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      protheus_customer_group_units: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          cod: string
          created_at: string
          filial: string
          group_id: number
          id: string
          loja: string
          protheus_table_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          cod: string
          created_at?: string
          filial: string
          group_id: number
          id?: string
          loja: string
          protheus_table_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          cod?: string
          created_at?: string
          filial?: string
          group_id?: number
          id?: string
          loja?: string
          protheus_table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protheus_customer_group_units_id_grupo_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "protheus_customer_groups"
            referencedColumns: ["id_grupo"]
          },
        ]
      }
      protheus_customer_groups: {
        Row: {
          ai_suggested_name: string | null
          cod: string
          created_at: string
          data: Json
          filial: string
          group_key: string | null
          id: string
          id_grupo: number
          name: string | null
          name_source: string
          nome_grupo_sugerido: string | null
          protheus_table_id: string
          unit_count: number
          updated_at: string
          vendors: string[] | null
        }
        Insert: {
          ai_suggested_name?: string | null
          cod: string
          created_at?: string
          data?: Json
          filial: string
          group_key?: string | null
          id?: string
          id_grupo?: number
          name?: string | null
          name_source?: string
          nome_grupo_sugerido?: string | null
          protheus_table_id: string
          unit_count?: number
          updated_at?: string
          vendors?: string[] | null
        }
        Update: {
          ai_suggested_name?: string | null
          cod?: string
          created_at?: string
          data?: Json
          filial?: string
          group_key?: string | null
          id?: string
          id_grupo?: number
          name?: string | null
          name_source?: string
          nome_grupo_sugerido?: string | null
          protheus_table_id?: string
          unit_count?: number
          updated_at?: string
          vendors?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "protheus_customer_groups_protheus_table_id_fkey"
            columns: ["protheus_table_id"]
            isOneToOne: false
            referencedRelation: "protheus_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      protheus_dynamic_tables: {
        Row: {
          created_at: string
          id: string
          protheus_table_id: string
          supabase_table_name: string
          table_structure: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          protheus_table_id: string
          supabase_table_name: string
          table_structure?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          protheus_table_id?: string
          supabase_table_name?: string
          table_structure?: Json
          updated_at?: string
        }
        Relationships: []
      }
      protheus_group_update_results: {
        Row: {
          action: string
          cod: string
          created_at: string
          filial: string
          group_id: number
          id: string
          loja: string
          reason: string | null
          run_id: string
        }
        Insert: {
          action: string
          cod: string
          created_at?: string
          filial: string
          group_id: number
          id?: string
          loja: string
          reason?: string | null
          run_id: string
        }
        Update: {
          action?: string
          cod?: string
          created_at?: string
          filial?: string
          group_id?: number
          id?: string
          loja?: string
          reason?: string | null
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protheus_group_update_results_id_grupo_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "protheus_customer_groups"
            referencedColumns: ["id_grupo"]
          },
          {
            foreignKeyName: "protheus_group_update_results_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "protheus_group_update_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      protheus_group_update_runs: {
        Row: {
          created_at: string
          details: Json | null
          finished_at: string | null
          id: string
          new_groups_count: number | null
          new_members_count: number | null
          protheus_table_id: string
          started_at: string
          triggered_by: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          finished_at?: string | null
          id?: string
          new_groups_count?: number | null
          new_members_count?: number | null
          protheus_table_id: string
          started_at?: string
          triggered_by?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          finished_at?: string | null
          id?: string
          new_groups_count?: number | null
          new_members_count?: number | null
          protheus_table_id?: string
          started_at?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      protheus_sa1010_80f17f00: {
        Row: {
          a1_abatimp: string | null
          a1_abics: string | null
          a1_agreg: string | null
          a1_alifixa: string | null
          a1_aliqir: number | null
          a1_ativida: string | null
          a1_atr: number | null
          a1_b2b: string | null
          a1_bairro: string | null
          a1_bairroc: string | null
          a1_bairroe: string | null
          a1_bco1: string | null
          a1_bco2: string | null
          a1_bco3: string | null
          a1_bco4: string | null
          a1_bco5: string | null
          a1_blemail: string | null
          a1_calcsuf: string | null
          a1_cargo1: string | null
          a1_cargo2: string | null
          a1_cargo3: string | null
          a1_cbo: string | null
          a1_cdrdes: string | null
          a1_ceinss: string | null
          a1_cep: string | null
          a1_cepc: string | null
          a1_cepe: string | null
          a1_cgc: string | null
          a1_chqdevo: number | null
          a1_chvcam: string | null
          a1_classe: string | null
          a1_clasven: string | null
          a1_clicnv: string | null
          a1_clifat: string | null
          a1_clipri: string | null
          a1_cnae: string | null
          a1_cod: string | null
          a1_cod_mun: string | null
          a1_codage: string | null
          a1_codfid: string | null
          a1_codfor: string | null
          a1_codhist: string | null
          a1_codloc: string | null
          a1_codmarc: string | null
          a1_codmemb: string | null
          a1_codmun: string | null
          a1_codmune: string | null
          a1_codpais: string | null
          a1_codseg: string | null
          a1_codsiaf: string | null
          a1_codter: string | null
          a1_comage: number | null
          a1_comis: number | null
          a1_compent: string | null
          a1_complem: string | null
          a1_cond: string | null
          a1_condpag: string | null
          a1_conta: string | null
          a1_contab: string | null
          a1_contato: string | null
          a1_contrib: string | null
          a1_crdma: string | null
          a1_ctare: string | null
          a1_cxposta: string | null
          a1_ddd: string | null
          a1_ddi: string | null
          a1_desc: number | null
          a1_dest_1: string | null
          a1_dest_2: string | null
          a1_dest_3: string | null
          a1_diaspag: number | null
          a1_dscreg: string | null
          a1_dtcad: string | null
          a1_dtfimv: string | null
          a1_dtiniv: string | null
          a1_dtnasc: string | null
          a1_dtulchq: string | null
          a1_dtultit: string | null
          a1_email: string | null
          a1_end: string | null
          a1_endcob: string | null
          a1_endent: string | null
          a1_endnot: string | null
          a1_endrec: string | null
          a1_entid: string | null
          a1_entori: string | null
          a1_est: string | null
          a1_estado: string | null
          a1_estc: string | null
          a1_este: string | null
          a1_fax: string | null
          a1_fildeb: string | null
          a1_filial: string | null
          a1_filtrf: string | null
          a1_fomezer: string | null
          a1_formvis: string | null
          a1_fretiss: string | null
          a1_grptrib: string | null
          a1_grpven: string | null
          a1_hpage: string | null
          a1_hrcad: string | null
          a1_hrexpo: string | null
          a1_hrtrans: string | null
          a1_ibge: string | null
          a1_idestn: string | null
          a1_idhist: string | null
          a1_iencont: string | null
          a1_imgumov: string | null
          a1_inciss: string | null
          a1_incltmg: string | null
          a1_incult: string | null
          a1_indret: string | null
          a1_inovaut: string | null
          a1_inscr: string | null
          a1_inscrm: string | null
          a1_inscrur: string | null
          a1_ipweb: string | null
          a1_irbax: string | null
          a1_issrslc: string | null
          a1_lc: number | null
          a1_lcfin: number | null
          a1_loccons: string | null
          a1_loja: string | null
          a1_lojpri: string | null
          a1_maidupl: number | null
          a1_matfun: string | null
          a1_matr: number | null
          a1_mcompra: number | null
          a1_mensage: string | null
          a1_metr: number | null
          a1_minirf: string | null
          a1_moedalc: number | null
          a1_msaldo: number | null
          a1_msblql: string | null
          a1_msexp: string | null
          a1_mun: string | null
          a1_munc: string | null
          a1_mune: string | null
          a1_naturez: string | null
          a1_nif: string | null
          a1_nome: string | null
          a1_nreduz: string | null
          a1_nrocom: number | null
          a1_nropag: number | null
          a1_numra: string | null
          a1_nvestn: number | null
          a1_obs: string | null
          a1_observ: string | null
          a1_origct: string | null
          a1_origem: string | null
          a1_outrmun: string | null
          a1_pagatr: number | null
          a1_pais: string | null
          a1_percatm: number | null
          a1_perfecp: number | null
          a1_perfil: number | null
          a1_pessoa: string | null
          a1_pfisica: string | null
          a1_prf_cod: string | null
          a1_prf_obs: string | null
          a1_prf_vld: string | null
          a1_pricom: string | null
          a1_prior: string | null
          a1_prstser: string | null
          a1_reccofi: string | null
          a1_reccsll: string | null
          a1_recfet: string | null
          a1_recfmd: string | null
          a1_recinss: string | null
          a1_recirrf: string | null
          a1_reciss: string | null
          a1_recpis: string | null
          a1_regesim: string | null
          a1_regiao: string | null
          a1_regpb: string | null
          a1_reserve: string | null
          a1_resfat: string | null
          a1_rfabov: string | null
          a1_rfacs: string | null
          a1_rfasemt: string | null
          a1_rg: string | null
          a1_rimamt: string | null
          a1_risco: string | null
          a1_rtec: string | null
          a1_saldup: number | null
          a1_saldupm: number | null
          a1_salfin: number | null
          a1_salfinm: number | null
          a1_salped: number | null
          a1_salpedb: number | null
          a1_salpedl: number | null
          a1_sativ1: string | null
          a1_sativ2: string | null
          a1_sativ3: string | null
          a1_sativ4: string | null
          a1_sativ5: string | null
          a1_sativ6: string | null
          a1_sativ7: string | null
          a1_sativ8: string | null
          a1_simples: string | null
          a1_simpnac: string | null
          a1_situa: string | null
          a1_subcod: string | null
          a1_suframa: string | null
          a1_super: string | null
          a1_tabela: string | null
          a1_tda: string | null
          a1_tel: string | null
          a1_telex: string | null
          a1_temvis: number | null
          a1_timekee: string | null
          a1_tipcli: string | null
          a1_tipo: string | null
          a1_tipocli: string | null
          a1_tipper: string | null
          a1_tipprfl: string | null
          a1_titprot: number | null
          a1_tmpstd: string | null
          a1_tmpvis: string | null
          a1_tpcamp: string | null
          a1_tpdp: string | null
          a1_tpessoa: string | null
          a1_tpfret: string | null
          a1_tpissrs: string | null
          a1_tpj: string | null
          a1_tpmemb: string | null
          a1_tpnfse: string | null
          a1_tpreg: string | null
          a1_transf: string | null
          a1_transp: string | null
          a1_tribfav: string | null
          a1_ultcom: string | null
          a1_ultvis: string | null
          a1_unidven: string | null
          a1_usadda: string | null
          a1_userlga: string | null
          a1_userlgi: string | null
          a1_vacum: number | null
          a1_venclc: string | null
          a1_vend: string | null
          a1_vinculo: string | null
          a1_zzctaad: string | null
          codeloja: string | null
          created_at: string
          d_e_l_e_t: string | null
          id: string
          is_new_record: boolean
          last_sync_id: string | null
          last_synced_at: string | null
          pending_deletion: boolean
          pending_deletion_at: string | null
          previous_record_hash: string | null
          protheus_id: string | null
          r_e_c_d_e_l: number | null
          r_e_c_n_o: number | null
          record_hash: string | null
          record_status:
            | Database["public"]["Enums"]["protheus_record_status"]
            | null
          teste_campo: string | null
          updated_at: string
          was_updated_last_sync: boolean
        }
        Insert: {
          a1_abatimp?: string | null
          a1_abics?: string | null
          a1_agreg?: string | null
          a1_alifixa?: string | null
          a1_aliqir?: number | null
          a1_ativida?: string | null
          a1_atr?: number | null
          a1_b2b?: string | null
          a1_bairro?: string | null
          a1_bairroc?: string | null
          a1_bairroe?: string | null
          a1_bco1?: string | null
          a1_bco2?: string | null
          a1_bco3?: string | null
          a1_bco4?: string | null
          a1_bco5?: string | null
          a1_blemail?: string | null
          a1_calcsuf?: string | null
          a1_cargo1?: string | null
          a1_cargo2?: string | null
          a1_cargo3?: string | null
          a1_cbo?: string | null
          a1_cdrdes?: string | null
          a1_ceinss?: string | null
          a1_cep?: string | null
          a1_cepc?: string | null
          a1_cepe?: string | null
          a1_cgc?: string | null
          a1_chqdevo?: number | null
          a1_chvcam?: string | null
          a1_classe?: string | null
          a1_clasven?: string | null
          a1_clicnv?: string | null
          a1_clifat?: string | null
          a1_clipri?: string | null
          a1_cnae?: string | null
          a1_cod?: string | null
          a1_cod_mun?: string | null
          a1_codage?: string | null
          a1_codfid?: string | null
          a1_codfor?: string | null
          a1_codhist?: string | null
          a1_codloc?: string | null
          a1_codmarc?: string | null
          a1_codmemb?: string | null
          a1_codmun?: string | null
          a1_codmune?: string | null
          a1_codpais?: string | null
          a1_codseg?: string | null
          a1_codsiaf?: string | null
          a1_codter?: string | null
          a1_comage?: number | null
          a1_comis?: number | null
          a1_compent?: string | null
          a1_complem?: string | null
          a1_cond?: string | null
          a1_condpag?: string | null
          a1_conta?: string | null
          a1_contab?: string | null
          a1_contato?: string | null
          a1_contrib?: string | null
          a1_crdma?: string | null
          a1_ctare?: string | null
          a1_cxposta?: string | null
          a1_ddd?: string | null
          a1_ddi?: string | null
          a1_desc?: number | null
          a1_dest_1?: string | null
          a1_dest_2?: string | null
          a1_dest_3?: string | null
          a1_diaspag?: number | null
          a1_dscreg?: string | null
          a1_dtcad?: string | null
          a1_dtfimv?: string | null
          a1_dtiniv?: string | null
          a1_dtnasc?: string | null
          a1_dtulchq?: string | null
          a1_dtultit?: string | null
          a1_email?: string | null
          a1_end?: string | null
          a1_endcob?: string | null
          a1_endent?: string | null
          a1_endnot?: string | null
          a1_endrec?: string | null
          a1_entid?: string | null
          a1_entori?: string | null
          a1_est?: string | null
          a1_estado?: string | null
          a1_estc?: string | null
          a1_este?: string | null
          a1_fax?: string | null
          a1_fildeb?: string | null
          a1_filial?: string | null
          a1_filtrf?: string | null
          a1_fomezer?: string | null
          a1_formvis?: string | null
          a1_fretiss?: string | null
          a1_grptrib?: string | null
          a1_grpven?: string | null
          a1_hpage?: string | null
          a1_hrcad?: string | null
          a1_hrexpo?: string | null
          a1_hrtrans?: string | null
          a1_ibge?: string | null
          a1_idestn?: string | null
          a1_idhist?: string | null
          a1_iencont?: string | null
          a1_imgumov?: string | null
          a1_inciss?: string | null
          a1_incltmg?: string | null
          a1_incult?: string | null
          a1_indret?: string | null
          a1_inovaut?: string | null
          a1_inscr?: string | null
          a1_inscrm?: string | null
          a1_inscrur?: string | null
          a1_ipweb?: string | null
          a1_irbax?: string | null
          a1_issrslc?: string | null
          a1_lc?: number | null
          a1_lcfin?: number | null
          a1_loccons?: string | null
          a1_loja?: string | null
          a1_lojpri?: string | null
          a1_maidupl?: number | null
          a1_matfun?: string | null
          a1_matr?: number | null
          a1_mcompra?: number | null
          a1_mensage?: string | null
          a1_metr?: number | null
          a1_minirf?: string | null
          a1_moedalc?: number | null
          a1_msaldo?: number | null
          a1_msblql?: string | null
          a1_msexp?: string | null
          a1_mun?: string | null
          a1_munc?: string | null
          a1_mune?: string | null
          a1_naturez?: string | null
          a1_nif?: string | null
          a1_nome?: string | null
          a1_nreduz?: string | null
          a1_nrocom?: number | null
          a1_nropag?: number | null
          a1_numra?: string | null
          a1_nvestn?: number | null
          a1_obs?: string | null
          a1_observ?: string | null
          a1_origct?: string | null
          a1_origem?: string | null
          a1_outrmun?: string | null
          a1_pagatr?: number | null
          a1_pais?: string | null
          a1_percatm?: number | null
          a1_perfecp?: number | null
          a1_perfil?: number | null
          a1_pessoa?: string | null
          a1_pfisica?: string | null
          a1_prf_cod?: string | null
          a1_prf_obs?: string | null
          a1_prf_vld?: string | null
          a1_pricom?: string | null
          a1_prior?: string | null
          a1_prstser?: string | null
          a1_reccofi?: string | null
          a1_reccsll?: string | null
          a1_recfet?: string | null
          a1_recfmd?: string | null
          a1_recinss?: string | null
          a1_recirrf?: string | null
          a1_reciss?: string | null
          a1_recpis?: string | null
          a1_regesim?: string | null
          a1_regiao?: string | null
          a1_regpb?: string | null
          a1_reserve?: string | null
          a1_resfat?: string | null
          a1_rfabov?: string | null
          a1_rfacs?: string | null
          a1_rfasemt?: string | null
          a1_rg?: string | null
          a1_rimamt?: string | null
          a1_risco?: string | null
          a1_rtec?: string | null
          a1_saldup?: number | null
          a1_saldupm?: number | null
          a1_salfin?: number | null
          a1_salfinm?: number | null
          a1_salped?: number | null
          a1_salpedb?: number | null
          a1_salpedl?: number | null
          a1_sativ1?: string | null
          a1_sativ2?: string | null
          a1_sativ3?: string | null
          a1_sativ4?: string | null
          a1_sativ5?: string | null
          a1_sativ6?: string | null
          a1_sativ7?: string | null
          a1_sativ8?: string | null
          a1_simples?: string | null
          a1_simpnac?: string | null
          a1_situa?: string | null
          a1_subcod?: string | null
          a1_suframa?: string | null
          a1_super?: string | null
          a1_tabela?: string | null
          a1_tda?: string | null
          a1_tel?: string | null
          a1_telex?: string | null
          a1_temvis?: number | null
          a1_timekee?: string | null
          a1_tipcli?: string | null
          a1_tipo?: string | null
          a1_tipocli?: string | null
          a1_tipper?: string | null
          a1_tipprfl?: string | null
          a1_titprot?: number | null
          a1_tmpstd?: string | null
          a1_tmpvis?: string | null
          a1_tpcamp?: string | null
          a1_tpdp?: string | null
          a1_tpessoa?: string | null
          a1_tpfret?: string | null
          a1_tpissrs?: string | null
          a1_tpj?: string | null
          a1_tpmemb?: string | null
          a1_tpnfse?: string | null
          a1_tpreg?: string | null
          a1_transf?: string | null
          a1_transp?: string | null
          a1_tribfav?: string | null
          a1_ultcom?: string | null
          a1_ultvis?: string | null
          a1_unidven?: string | null
          a1_usadda?: string | null
          a1_userlga?: string | null
          a1_userlgi?: string | null
          a1_vacum?: number | null
          a1_venclc?: string | null
          a1_vend?: string | null
          a1_vinculo?: string | null
          a1_zzctaad?: string | null
          codeloja?: string | null
          created_at?: string
          d_e_l_e_t?: string | null
          id?: string
          is_new_record?: boolean
          last_sync_id?: string | null
          last_synced_at?: string | null
          pending_deletion?: boolean
          pending_deletion_at?: string | null
          previous_record_hash?: string | null
          protheus_id?: string | null
          r_e_c_d_e_l?: number | null
          r_e_c_n_o?: number | null
          record_hash?: string | null
          record_status?:
            | Database["public"]["Enums"]["protheus_record_status"]
            | null
          teste_campo?: string | null
          updated_at?: string
          was_updated_last_sync?: boolean
        }
        Update: {
          a1_abatimp?: string | null
          a1_abics?: string | null
          a1_agreg?: string | null
          a1_alifixa?: string | null
          a1_aliqir?: number | null
          a1_ativida?: string | null
          a1_atr?: number | null
          a1_b2b?: string | null
          a1_bairro?: string | null
          a1_bairroc?: string | null
          a1_bairroe?: string | null
          a1_bco1?: string | null
          a1_bco2?: string | null
          a1_bco3?: string | null
          a1_bco4?: string | null
          a1_bco5?: string | null
          a1_blemail?: string | null
          a1_calcsuf?: string | null
          a1_cargo1?: string | null
          a1_cargo2?: string | null
          a1_cargo3?: string | null
          a1_cbo?: string | null
          a1_cdrdes?: string | null
          a1_ceinss?: string | null
          a1_cep?: string | null
          a1_cepc?: string | null
          a1_cepe?: string | null
          a1_cgc?: string | null
          a1_chqdevo?: number | null
          a1_chvcam?: string | null
          a1_classe?: string | null
          a1_clasven?: string | null
          a1_clicnv?: string | null
          a1_clifat?: string | null
          a1_clipri?: string | null
          a1_cnae?: string | null
          a1_cod?: string | null
          a1_cod_mun?: string | null
          a1_codage?: string | null
          a1_codfid?: string | null
          a1_codfor?: string | null
          a1_codhist?: string | null
          a1_codloc?: string | null
          a1_codmarc?: string | null
          a1_codmemb?: string | null
          a1_codmun?: string | null
          a1_codmune?: string | null
          a1_codpais?: string | null
          a1_codseg?: string | null
          a1_codsiaf?: string | null
          a1_codter?: string | null
          a1_comage?: number | null
          a1_comis?: number | null
          a1_compent?: string | null
          a1_complem?: string | null
          a1_cond?: string | null
          a1_condpag?: string | null
          a1_conta?: string | null
          a1_contab?: string | null
          a1_contato?: string | null
          a1_contrib?: string | null
          a1_crdma?: string | null
          a1_ctare?: string | null
          a1_cxposta?: string | null
          a1_ddd?: string | null
          a1_ddi?: string | null
          a1_desc?: number | null
          a1_dest_1?: string | null
          a1_dest_2?: string | null
          a1_dest_3?: string | null
          a1_diaspag?: number | null
          a1_dscreg?: string | null
          a1_dtcad?: string | null
          a1_dtfimv?: string | null
          a1_dtiniv?: string | null
          a1_dtnasc?: string | null
          a1_dtulchq?: string | null
          a1_dtultit?: string | null
          a1_email?: string | null
          a1_end?: string | null
          a1_endcob?: string | null
          a1_endent?: string | null
          a1_endnot?: string | null
          a1_endrec?: string | null
          a1_entid?: string | null
          a1_entori?: string | null
          a1_est?: string | null
          a1_estado?: string | null
          a1_estc?: string | null
          a1_este?: string | null
          a1_fax?: string | null
          a1_fildeb?: string | null
          a1_filial?: string | null
          a1_filtrf?: string | null
          a1_fomezer?: string | null
          a1_formvis?: string | null
          a1_fretiss?: string | null
          a1_grptrib?: string | null
          a1_grpven?: string | null
          a1_hpage?: string | null
          a1_hrcad?: string | null
          a1_hrexpo?: string | null
          a1_hrtrans?: string | null
          a1_ibge?: string | null
          a1_idestn?: string | null
          a1_idhist?: string | null
          a1_iencont?: string | null
          a1_imgumov?: string | null
          a1_inciss?: string | null
          a1_incltmg?: string | null
          a1_incult?: string | null
          a1_indret?: string | null
          a1_inovaut?: string | null
          a1_inscr?: string | null
          a1_inscrm?: string | null
          a1_inscrur?: string | null
          a1_ipweb?: string | null
          a1_irbax?: string | null
          a1_issrslc?: string | null
          a1_lc?: number | null
          a1_lcfin?: number | null
          a1_loccons?: string | null
          a1_loja?: string | null
          a1_lojpri?: string | null
          a1_maidupl?: number | null
          a1_matfun?: string | null
          a1_matr?: number | null
          a1_mcompra?: number | null
          a1_mensage?: string | null
          a1_metr?: number | null
          a1_minirf?: string | null
          a1_moedalc?: number | null
          a1_msaldo?: number | null
          a1_msblql?: string | null
          a1_msexp?: string | null
          a1_mun?: string | null
          a1_munc?: string | null
          a1_mune?: string | null
          a1_naturez?: string | null
          a1_nif?: string | null
          a1_nome?: string | null
          a1_nreduz?: string | null
          a1_nrocom?: number | null
          a1_nropag?: number | null
          a1_numra?: string | null
          a1_nvestn?: number | null
          a1_obs?: string | null
          a1_observ?: string | null
          a1_origct?: string | null
          a1_origem?: string | null
          a1_outrmun?: string | null
          a1_pagatr?: number | null
          a1_pais?: string | null
          a1_percatm?: number | null
          a1_perfecp?: number | null
          a1_perfil?: number | null
          a1_pessoa?: string | null
          a1_pfisica?: string | null
          a1_prf_cod?: string | null
          a1_prf_obs?: string | null
          a1_prf_vld?: string | null
          a1_pricom?: string | null
          a1_prior?: string | null
          a1_prstser?: string | null
          a1_reccofi?: string | null
          a1_reccsll?: string | null
          a1_recfet?: string | null
          a1_recfmd?: string | null
          a1_recinss?: string | null
          a1_recirrf?: string | null
          a1_reciss?: string | null
          a1_recpis?: string | null
          a1_regesim?: string | null
          a1_regiao?: string | null
          a1_regpb?: string | null
          a1_reserve?: string | null
          a1_resfat?: string | null
          a1_rfabov?: string | null
          a1_rfacs?: string | null
          a1_rfasemt?: string | null
          a1_rg?: string | null
          a1_rimamt?: string | null
          a1_risco?: string | null
          a1_rtec?: string | null
          a1_saldup?: number | null
          a1_saldupm?: number | null
          a1_salfin?: number | null
          a1_salfinm?: number | null
          a1_salped?: number | null
          a1_salpedb?: number | null
          a1_salpedl?: number | null
          a1_sativ1?: string | null
          a1_sativ2?: string | null
          a1_sativ3?: string | null
          a1_sativ4?: string | null
          a1_sativ5?: string | null
          a1_sativ6?: string | null
          a1_sativ7?: string | null
          a1_sativ8?: string | null
          a1_simples?: string | null
          a1_simpnac?: string | null
          a1_situa?: string | null
          a1_subcod?: string | null
          a1_suframa?: string | null
          a1_super?: string | null
          a1_tabela?: string | null
          a1_tda?: string | null
          a1_tel?: string | null
          a1_telex?: string | null
          a1_temvis?: number | null
          a1_timekee?: string | null
          a1_tipcli?: string | null
          a1_tipo?: string | null
          a1_tipocli?: string | null
          a1_tipper?: string | null
          a1_tipprfl?: string | null
          a1_titprot?: number | null
          a1_tmpstd?: string | null
          a1_tmpvis?: string | null
          a1_tpcamp?: string | null
          a1_tpdp?: string | null
          a1_tpessoa?: string | null
          a1_tpfret?: string | null
          a1_tpissrs?: string | null
          a1_tpj?: string | null
          a1_tpmemb?: string | null
          a1_tpnfse?: string | null
          a1_tpreg?: string | null
          a1_transf?: string | null
          a1_transp?: string | null
          a1_tribfav?: string | null
          a1_ultcom?: string | null
          a1_ultvis?: string | null
          a1_unidven?: string | null
          a1_usadda?: string | null
          a1_userlga?: string | null
          a1_userlgi?: string | null
          a1_vacum?: number | null
          a1_venclc?: string | null
          a1_vend?: string | null
          a1_vinculo?: string | null
          a1_zzctaad?: string | null
          codeloja?: string | null
          created_at?: string
          d_e_l_e_t?: string | null
          id?: string
          is_new_record?: boolean
          last_sync_id?: string | null
          last_synced_at?: string | null
          pending_deletion?: boolean
          pending_deletion_at?: string | null
          previous_record_hash?: string | null
          protheus_id?: string | null
          r_e_c_d_e_l?: number | null
          r_e_c_n_o?: number | null
          record_hash?: string | null
          record_status?:
            | Database["public"]["Enums"]["protheus_record_status"]
            | null
          teste_campo?: string | null
          updated_at?: string
          was_updated_last_sync?: boolean
        }
        Relationships: []
      }
      protheus_sa2010_72a51158: {
        Row: {
          a2_abics: string | null
          a2_agencia: string | null
          a2_apolice: string | null
          a2_ativida: string | null
          a2_b2b: string | null
          a2_baiex: string | null
          a2_bairro: string | null
          a2_banco: string | null
          a2_breex: string | null
          a2_calcinp: string | null
          a2_calcirf: string | null
          a2_cargo: string | null
          a2_catefd: string | null
          a2_categ: string | null
          a2_cbo: string | null
          a2_ccicms: string | null
          a2_cep: string | null
          a2_cgc: string | null
          a2_cgcex: string | null
          a2_cidex: string | null
          a2_civil: string | null
          a2_cliente: string | null
          a2_cliqf: string | null
          a2_cnae: string | null
          a2_cod: string | null
          a2_cod_mun: string | null
          a2_codadm: string | null
          a2_codblo: string | null
          a2_codfav: string | null
          a2_codfi: string | null
          a2_codinss: string | null
          a2_codloc: string | null
          a2_codmun: string | null
          a2_codnit: string | null
          a2_codpais: string | null
          a2_codsiaf: string | null
          a2_comi_so: string | null
          a2_complem: string | null
          a2_complr: string | null
          a2_cond: string | null
          a2_conffis: string | null
          a2_conreg: string | null
          a2_conta: string | null
          a2_contab: string | null
          a2_contato: string | null
          a2_contcom: string | null
          a2_contpre: string | null
          a2_contrib: string | null
          a2_cpfirp: string | null
          a2_cpfrur: string | null
          a2_cpomsp: string | null
          a2_cprb: string | null
          a2_ctare: string | null
          a2_cx_post: string | null
          a2_datblo: string | null
          a2_ddd: string | null
          a2_ddi: string | null
          a2_dedbspc: string | null
          a2_depto: string | null
          a2_desport: string | null
          a2_desvio: number | null
          a2_drpexp: string | null
          a2_dtava: string | null
          a2_dtconv: string | null
          a2_dtfimr: string | null
          a2_dtfimv: string | null
          a2_dtinir: string | null
          a2_dtiniv: string | null
          a2_dtnasc: string | null
          a2_dtrntrc: string | null
          a2_dtval: string | null
          a2_dvage: string | null
          a2_dvcta: string | null
          a2_email: string | null
          a2_end: string | null
          a2_endcomp: string | null
          a2_endnot: string | null
          a2_eqptac: string | null
          a2_est: string | null
          a2_estado: string | null
          a2_estex: string | null
          a2_fabrica: string | null
          a2_fatava: number | null
          a2_fax: string | null
          a2_fildeb: string | null
          a2_filial: string | null
          a2_filtrf: string | null
          a2_fomezer: string | null
          a2_formpag: string | null
          a2_fornema: string | null
          a2_fretiss: string | null
          a2_grossir: string | null
          a2_grpdep: string | null
          a2_grptrib: string | null
          a2_grupo: string | null
          a2_hpage: string | null
          a2_ibge: string | null
          a2_id_fbfn: string | null
          a2_id_repr: string | null
          a2_idhist: string | null
          a2_impip: string | null
          a2_incltmg: string | null
          a2_incult: string | null
          a2_indcp: string | null
          a2_indrur: string | null
          a2_inovaut: string | null
          a2_inscmu: string | null
          a2_inscr: string | null
          a2_inscrm: string | null
          a2_irprog: string | null
          a2_isicm: string | null
          a2_issrslc: string | null
          a2_lc: string | null
          a2_locquit: string | null
          a2_logex: string | null
          a2_loja: string | null
          a2_lojcli: string | null
          a2_lojfav: string | null
          a2_matr: number | null
          a2_mcompra: number | null
          a2_metr: number | null
          a2_minirf: string | null
          a2_minpub: string | null
          a2_mjuridi: string | null
          a2_mnota: number | null
          a2_motnif: string | null
          a2_msaldo: number | null
          a2_msblqd: string | null
          a2_msblql: string | null
          a2_mun: string | null
          a2_munsc: string | null
          a2_naturez: string | null
          a2_nempr: string | null
          a2_nifex: string | null
          a2_nome: string | null
          a2_nomresp: string | null
          a2_nr_end: string | null
          a2_nreduz: string | null
          a2_nrocom: number | null
          a2_numcon: string | null
          a2_numdep: number | null
          a2_numex: string | null
          a2_numra: string | null
          a2_ocorren: string | null
          a2_ok: string | null
          a2_orig_1: string | null
          a2_orig_2: string | null
          a2_orig_3: string | null
          a2_pagamen: string | null
          a2_paggfe: string | null
          a2_pais: string | null
          a2_paisex: string | null
          a2_paisori: string | null
          a2_paissub: string | null
          a2_pfisica: string | null
          a2_plcrres: string | null
          a2_plfil: string | null
          a2_plgrupo: string | null
          a2_plpedes: number | null
          a2_posex: string | null
          a2_pricom: string | null
          a2_prior: string | null
          a2_prstser: string | null
          a2_reccide: string | null
          a2_reccofi: string | null
          a2_reccsll: string | null
          a2_recfet: string | null
          a2_recfmd: string | null
          a2_recinss: string | null
          a2_reciss: string | null
          a2_recpis: string | null
          a2_recsest: string | null
          a2_regesim: string | null
          a2_regpb: string | null
          a2_repbair: string | null
          a2_repcont: string | null
          a2_reppais: string | null
          a2_repr_ag: string | null
          a2_repr_ba: string | null
          a2_repr_co: string | null
          a2_repr_em: string | null
          a2_repr_en: string | null
          a2_reprcep: string | null
          a2_reprcgc: string | null
          a2_repres: string | null
          a2_represt: string | null
          a2_reprfax: string | null
          a2_reprmun: string | null
          a2_reprtel: string | null
          a2_resptri: string | null
          a2_ret_pai: string | null
          a2_retisi: string | null
          a2_rfabov: string | null
          a2_rfacs: string | null
          a2_rfasemt: string | null
          a2_rfundes: string | null
          a2_rimamt: string | null
          a2_risco: string | null
          a2_rntrc: string | null
          a2_royalty: string | null
          a2_roymin: number | null
          a2_saldup: number | null
          a2_saldupm: number | null
          a2_sativ1: string | null
          a2_siglcr: string | null
          a2_simpnac: string | null
          a2_sitesbh: string | null
          a2_status: string | null
          a2_strntrc: string | null
          a2_subcod: string | null
          a2_subcon: string | null
          a2_swift: string | null
          a2_tel: string | null
          a2_telex: string | null
          a2_telre: string | null
          a2_tipawb: string | null
          a2_tipcta: string | null
          a2_tipo: string | null
          a2_tiporur: string | null
          a2_tpcon: string | null
          a2_tpconta: string | null
          a2_tpent: string | null
          a2_tpessoa: string | null
          a2_tpissrs: string | null
          a2_tpj: string | null
          a2_tplogr: string | null
          a2_tpreg: string | null
          a2_tprex: string | null
          a2_tprntrc: string | null
          a2_transp: string | null
          a2_trbex: string | null
          a2_tribfav: string | null
          a2_txtribu: number | null
          a2_uffic: string | null
          a2_ultcom: string | null
          a2_unfedrp: string | null
          a2_vincula: string | null
          a2_vinculo: string | null
          a2_zzctaad: string | null
          created_at: string
          d_e_l_e_t: string | null
          id: string
          is_new_record: boolean
          last_sync_id: string | null
          last_synced_at: string | null
          pending_deletion: boolean
          pending_deletion_at: string | null
          previous_record_hash: string | null
          protheus_id: string | null
          r_e_c_d_e_l: number | null
          r_e_c_n_o: number | null
          record_hash: string | null
          updated_at: string
          was_updated_last_sync: boolean
        }
        Insert: {
          a2_abics?: string | null
          a2_agencia?: string | null
          a2_apolice?: string | null
          a2_ativida?: string | null
          a2_b2b?: string | null
          a2_baiex?: string | null
          a2_bairro?: string | null
          a2_banco?: string | null
          a2_breex?: string | null
          a2_calcinp?: string | null
          a2_calcirf?: string | null
          a2_cargo?: string | null
          a2_catefd?: string | null
          a2_categ?: string | null
          a2_cbo?: string | null
          a2_ccicms?: string | null
          a2_cep?: string | null
          a2_cgc?: string | null
          a2_cgcex?: string | null
          a2_cidex?: string | null
          a2_civil?: string | null
          a2_cliente?: string | null
          a2_cliqf?: string | null
          a2_cnae?: string | null
          a2_cod?: string | null
          a2_cod_mun?: string | null
          a2_codadm?: string | null
          a2_codblo?: string | null
          a2_codfav?: string | null
          a2_codfi?: string | null
          a2_codinss?: string | null
          a2_codloc?: string | null
          a2_codmun?: string | null
          a2_codnit?: string | null
          a2_codpais?: string | null
          a2_codsiaf?: string | null
          a2_comi_so?: string | null
          a2_complem?: string | null
          a2_complr?: string | null
          a2_cond?: string | null
          a2_conffis?: string | null
          a2_conreg?: string | null
          a2_conta?: string | null
          a2_contab?: string | null
          a2_contato?: string | null
          a2_contcom?: string | null
          a2_contpre?: string | null
          a2_contrib?: string | null
          a2_cpfirp?: string | null
          a2_cpfrur?: string | null
          a2_cpomsp?: string | null
          a2_cprb?: string | null
          a2_ctare?: string | null
          a2_cx_post?: string | null
          a2_datblo?: string | null
          a2_ddd?: string | null
          a2_ddi?: string | null
          a2_dedbspc?: string | null
          a2_depto?: string | null
          a2_desport?: string | null
          a2_desvio?: number | null
          a2_drpexp?: string | null
          a2_dtava?: string | null
          a2_dtconv?: string | null
          a2_dtfimr?: string | null
          a2_dtfimv?: string | null
          a2_dtinir?: string | null
          a2_dtiniv?: string | null
          a2_dtnasc?: string | null
          a2_dtrntrc?: string | null
          a2_dtval?: string | null
          a2_dvage?: string | null
          a2_dvcta?: string | null
          a2_email?: string | null
          a2_end?: string | null
          a2_endcomp?: string | null
          a2_endnot?: string | null
          a2_eqptac?: string | null
          a2_est?: string | null
          a2_estado?: string | null
          a2_estex?: string | null
          a2_fabrica?: string | null
          a2_fatava?: number | null
          a2_fax?: string | null
          a2_fildeb?: string | null
          a2_filial?: string | null
          a2_filtrf?: string | null
          a2_fomezer?: string | null
          a2_formpag?: string | null
          a2_fornema?: string | null
          a2_fretiss?: string | null
          a2_grossir?: string | null
          a2_grpdep?: string | null
          a2_grptrib?: string | null
          a2_grupo?: string | null
          a2_hpage?: string | null
          a2_ibge?: string | null
          a2_id_fbfn?: string | null
          a2_id_repr?: string | null
          a2_idhist?: string | null
          a2_impip?: string | null
          a2_incltmg?: string | null
          a2_incult?: string | null
          a2_indcp?: string | null
          a2_indrur?: string | null
          a2_inovaut?: string | null
          a2_inscmu?: string | null
          a2_inscr?: string | null
          a2_inscrm?: string | null
          a2_irprog?: string | null
          a2_isicm?: string | null
          a2_issrslc?: string | null
          a2_lc?: string | null
          a2_locquit?: string | null
          a2_logex?: string | null
          a2_loja?: string | null
          a2_lojcli?: string | null
          a2_lojfav?: string | null
          a2_matr?: number | null
          a2_mcompra?: number | null
          a2_metr?: number | null
          a2_minirf?: string | null
          a2_minpub?: string | null
          a2_mjuridi?: string | null
          a2_mnota?: number | null
          a2_motnif?: string | null
          a2_msaldo?: number | null
          a2_msblqd?: string | null
          a2_msblql?: string | null
          a2_mun?: string | null
          a2_munsc?: string | null
          a2_naturez?: string | null
          a2_nempr?: string | null
          a2_nifex?: string | null
          a2_nome?: string | null
          a2_nomresp?: string | null
          a2_nr_end?: string | null
          a2_nreduz?: string | null
          a2_nrocom?: number | null
          a2_numcon?: string | null
          a2_numdep?: number | null
          a2_numex?: string | null
          a2_numra?: string | null
          a2_ocorren?: string | null
          a2_ok?: string | null
          a2_orig_1?: string | null
          a2_orig_2?: string | null
          a2_orig_3?: string | null
          a2_pagamen?: string | null
          a2_paggfe?: string | null
          a2_pais?: string | null
          a2_paisex?: string | null
          a2_paisori?: string | null
          a2_paissub?: string | null
          a2_pfisica?: string | null
          a2_plcrres?: string | null
          a2_plfil?: string | null
          a2_plgrupo?: string | null
          a2_plpedes?: number | null
          a2_posex?: string | null
          a2_pricom?: string | null
          a2_prior?: string | null
          a2_prstser?: string | null
          a2_reccide?: string | null
          a2_reccofi?: string | null
          a2_reccsll?: string | null
          a2_recfet?: string | null
          a2_recfmd?: string | null
          a2_recinss?: string | null
          a2_reciss?: string | null
          a2_recpis?: string | null
          a2_recsest?: string | null
          a2_regesim?: string | null
          a2_regpb?: string | null
          a2_repbair?: string | null
          a2_repcont?: string | null
          a2_reppais?: string | null
          a2_repr_ag?: string | null
          a2_repr_ba?: string | null
          a2_repr_co?: string | null
          a2_repr_em?: string | null
          a2_repr_en?: string | null
          a2_reprcep?: string | null
          a2_reprcgc?: string | null
          a2_repres?: string | null
          a2_represt?: string | null
          a2_reprfax?: string | null
          a2_reprmun?: string | null
          a2_reprtel?: string | null
          a2_resptri?: string | null
          a2_ret_pai?: string | null
          a2_retisi?: string | null
          a2_rfabov?: string | null
          a2_rfacs?: string | null
          a2_rfasemt?: string | null
          a2_rfundes?: string | null
          a2_rimamt?: string | null
          a2_risco?: string | null
          a2_rntrc?: string | null
          a2_royalty?: string | null
          a2_roymin?: number | null
          a2_saldup?: number | null
          a2_saldupm?: number | null
          a2_sativ1?: string | null
          a2_siglcr?: string | null
          a2_simpnac?: string | null
          a2_sitesbh?: string | null
          a2_status?: string | null
          a2_strntrc?: string | null
          a2_subcod?: string | null
          a2_subcon?: string | null
          a2_swift?: string | null
          a2_tel?: string | null
          a2_telex?: string | null
          a2_telre?: string | null
          a2_tipawb?: string | null
          a2_tipcta?: string | null
          a2_tipo?: string | null
          a2_tiporur?: string | null
          a2_tpcon?: string | null
          a2_tpconta?: string | null
          a2_tpent?: string | null
          a2_tpessoa?: string | null
          a2_tpissrs?: string | null
          a2_tpj?: string | null
          a2_tplogr?: string | null
          a2_tpreg?: string | null
          a2_tprex?: string | null
          a2_tprntrc?: string | null
          a2_transp?: string | null
          a2_trbex?: string | null
          a2_tribfav?: string | null
          a2_txtribu?: number | null
          a2_uffic?: string | null
          a2_ultcom?: string | null
          a2_unfedrp?: string | null
          a2_vincula?: string | null
          a2_vinculo?: string | null
          a2_zzctaad?: string | null
          created_at?: string
          d_e_l_e_t?: string | null
          id?: string
          is_new_record?: boolean
          last_sync_id?: string | null
          last_synced_at?: string | null
          pending_deletion?: boolean
          pending_deletion_at?: string | null
          previous_record_hash?: string | null
          protheus_id?: string | null
          r_e_c_d_e_l?: number | null
          r_e_c_n_o?: number | null
          record_hash?: string | null
          updated_at?: string
          was_updated_last_sync?: boolean
        }
        Update: {
          a2_abics?: string | null
          a2_agencia?: string | null
          a2_apolice?: string | null
          a2_ativida?: string | null
          a2_b2b?: string | null
          a2_baiex?: string | null
          a2_bairro?: string | null
          a2_banco?: string | null
          a2_breex?: string | null
          a2_calcinp?: string | null
          a2_calcirf?: string | null
          a2_cargo?: string | null
          a2_catefd?: string | null
          a2_categ?: string | null
          a2_cbo?: string | null
          a2_ccicms?: string | null
          a2_cep?: string | null
          a2_cgc?: string | null
          a2_cgcex?: string | null
          a2_cidex?: string | null
          a2_civil?: string | null
          a2_cliente?: string | null
          a2_cliqf?: string | null
          a2_cnae?: string | null
          a2_cod?: string | null
          a2_cod_mun?: string | null
          a2_codadm?: string | null
          a2_codblo?: string | null
          a2_codfav?: string | null
          a2_codfi?: string | null
          a2_codinss?: string | null
          a2_codloc?: string | null
          a2_codmun?: string | null
          a2_codnit?: string | null
          a2_codpais?: string | null
          a2_codsiaf?: string | null
          a2_comi_so?: string | null
          a2_complem?: string | null
          a2_complr?: string | null
          a2_cond?: string | null
          a2_conffis?: string | null
          a2_conreg?: string | null
          a2_conta?: string | null
          a2_contab?: string | null
          a2_contato?: string | null
          a2_contcom?: string | null
          a2_contpre?: string | null
          a2_contrib?: string | null
          a2_cpfirp?: string | null
          a2_cpfrur?: string | null
          a2_cpomsp?: string | null
          a2_cprb?: string | null
          a2_ctare?: string | null
          a2_cx_post?: string | null
          a2_datblo?: string | null
          a2_ddd?: string | null
          a2_ddi?: string | null
          a2_dedbspc?: string | null
          a2_depto?: string | null
          a2_desport?: string | null
          a2_desvio?: number | null
          a2_drpexp?: string | null
          a2_dtava?: string | null
          a2_dtconv?: string | null
          a2_dtfimr?: string | null
          a2_dtfimv?: string | null
          a2_dtinir?: string | null
          a2_dtiniv?: string | null
          a2_dtnasc?: string | null
          a2_dtrntrc?: string | null
          a2_dtval?: string | null
          a2_dvage?: string | null
          a2_dvcta?: string | null
          a2_email?: string | null
          a2_end?: string | null
          a2_endcomp?: string | null
          a2_endnot?: string | null
          a2_eqptac?: string | null
          a2_est?: string | null
          a2_estado?: string | null
          a2_estex?: string | null
          a2_fabrica?: string | null
          a2_fatava?: number | null
          a2_fax?: string | null
          a2_fildeb?: string | null
          a2_filial?: string | null
          a2_filtrf?: string | null
          a2_fomezer?: string | null
          a2_formpag?: string | null
          a2_fornema?: string | null
          a2_fretiss?: string | null
          a2_grossir?: string | null
          a2_grpdep?: string | null
          a2_grptrib?: string | null
          a2_grupo?: string | null
          a2_hpage?: string | null
          a2_ibge?: string | null
          a2_id_fbfn?: string | null
          a2_id_repr?: string | null
          a2_idhist?: string | null
          a2_impip?: string | null
          a2_incltmg?: string | null
          a2_incult?: string | null
          a2_indcp?: string | null
          a2_indrur?: string | null
          a2_inovaut?: string | null
          a2_inscmu?: string | null
          a2_inscr?: string | null
          a2_inscrm?: string | null
          a2_irprog?: string | null
          a2_isicm?: string | null
          a2_issrslc?: string | null
          a2_lc?: string | null
          a2_locquit?: string | null
          a2_logex?: string | null
          a2_loja?: string | null
          a2_lojcli?: string | null
          a2_lojfav?: string | null
          a2_matr?: number | null
          a2_mcompra?: number | null
          a2_metr?: number | null
          a2_minirf?: string | null
          a2_minpub?: string | null
          a2_mjuridi?: string | null
          a2_mnota?: number | null
          a2_motnif?: string | null
          a2_msaldo?: number | null
          a2_msblqd?: string | null
          a2_msblql?: string | null
          a2_mun?: string | null
          a2_munsc?: string | null
          a2_naturez?: string | null
          a2_nempr?: string | null
          a2_nifex?: string | null
          a2_nome?: string | null
          a2_nomresp?: string | null
          a2_nr_end?: string | null
          a2_nreduz?: string | null
          a2_nrocom?: number | null
          a2_numcon?: string | null
          a2_numdep?: number | null
          a2_numex?: string | null
          a2_numra?: string | null
          a2_ocorren?: string | null
          a2_ok?: string | null
          a2_orig_1?: string | null
          a2_orig_2?: string | null
          a2_orig_3?: string | null
          a2_pagamen?: string | null
          a2_paggfe?: string | null
          a2_pais?: string | null
          a2_paisex?: string | null
          a2_paisori?: string | null
          a2_paissub?: string | null
          a2_pfisica?: string | null
          a2_plcrres?: string | null
          a2_plfil?: string | null
          a2_plgrupo?: string | null
          a2_plpedes?: number | null
          a2_posex?: string | null
          a2_pricom?: string | null
          a2_prior?: string | null
          a2_prstser?: string | null
          a2_reccide?: string | null
          a2_reccofi?: string | null
          a2_reccsll?: string | null
          a2_recfet?: string | null
          a2_recfmd?: string | null
          a2_recinss?: string | null
          a2_reciss?: string | null
          a2_recpis?: string | null
          a2_recsest?: string | null
          a2_regesim?: string | null
          a2_regpb?: string | null
          a2_repbair?: string | null
          a2_repcont?: string | null
          a2_reppais?: string | null
          a2_repr_ag?: string | null
          a2_repr_ba?: string | null
          a2_repr_co?: string | null
          a2_repr_em?: string | null
          a2_repr_en?: string | null
          a2_reprcep?: string | null
          a2_reprcgc?: string | null
          a2_repres?: string | null
          a2_represt?: string | null
          a2_reprfax?: string | null
          a2_reprmun?: string | null
          a2_reprtel?: string | null
          a2_resptri?: string | null
          a2_ret_pai?: string | null
          a2_retisi?: string | null
          a2_rfabov?: string | null
          a2_rfacs?: string | null
          a2_rfasemt?: string | null
          a2_rfundes?: string | null
          a2_rimamt?: string | null
          a2_risco?: string | null
          a2_rntrc?: string | null
          a2_royalty?: string | null
          a2_roymin?: number | null
          a2_saldup?: number | null
          a2_saldupm?: number | null
          a2_sativ1?: string | null
          a2_siglcr?: string | null
          a2_simpnac?: string | null
          a2_sitesbh?: string | null
          a2_status?: string | null
          a2_strntrc?: string | null
          a2_subcod?: string | null
          a2_subcon?: string | null
          a2_swift?: string | null
          a2_tel?: string | null
          a2_telex?: string | null
          a2_telre?: string | null
          a2_tipawb?: string | null
          a2_tipcta?: string | null
          a2_tipo?: string | null
          a2_tiporur?: string | null
          a2_tpcon?: string | null
          a2_tpconta?: string | null
          a2_tpent?: string | null
          a2_tpessoa?: string | null
          a2_tpissrs?: string | null
          a2_tpj?: string | null
          a2_tplogr?: string | null
          a2_tpreg?: string | null
          a2_tprex?: string | null
          a2_tprntrc?: string | null
          a2_transp?: string | null
          a2_trbex?: string | null
          a2_tribfav?: string | null
          a2_txtribu?: number | null
          a2_uffic?: string | null
          a2_ultcom?: string | null
          a2_unfedrp?: string | null
          a2_vincula?: string | null
          a2_vinculo?: string | null
          a2_zzctaad?: string | null
          created_at?: string
          d_e_l_e_t?: string | null
          id?: string
          is_new_record?: boolean
          last_sync_id?: string | null
          last_synced_at?: string | null
          pending_deletion?: boolean
          pending_deletion_at?: string | null
          previous_record_hash?: string | null
          protheus_id?: string | null
          r_e_c_d_e_l?: number | null
          r_e_c_n_o?: number | null
          record_hash?: string | null
          updated_at?: string
          was_updated_last_sync?: boolean
        }
        Relationships: []
      }
      protheus_sa3010_fc3d70f6: {
        Row: {
          a3_acrefin: string | null
          a3_admiss: string | null
          a3_albaixa: number | null
          a3_alemiss: number | null
          a3_bairro: string | null
          a3_baseir: string | null
          a3_bco1: string | null
          a3_biagend: string | null
          a3_bicont: string | null
          a3_bitaref: string | null
          a3_cargo: string | null
          a3_cel: string | null
          a3_cep: string | null
          a3_cgc: string | null
          a3_clifim: string | null
          a3_cliini: string | null
          a3_cod: string | null
          a3_codiss: string | null
          a3_codusr: string | null
          a3_comis: number | null
          a3_ddd: string | null
          a3_dddtel: string | null
          a3_ddi: string | null
          a3_depend: string | null
          a3_dia: number | null
          a3_diarese: number | null
          a3_dtumov: string | null
          a3_emacorp: string | null
          a3_email: string | null
          a3_end: string | null
          a3_est: string | null
          a3_fat_rh: string | null
          a3_fax: string | null
          a3_filfun: string | null
          a3_filial: string | null
          a3_fornece: string | null
          a3_frete: string | null
          a3_gerase2: string | null
          a3_geren: string | null
          a3_grprep: string | null
          a3_grupsan: string | null
          a3_habsinc: string | null
          a3_hand: string | null
          a3_hpage: string | null
          a3_hrexpo: string | null
          a3_hrumov: string | null
          a3_icm: string | null
          a3_icmsret: string | null
          a3_inscr: string | null
          a3_inscrm: string | null
          a3_ipi: string | null
          a3_iss: string | null
          a3_lanexg: string | null
          a3_loja: string | null
          a3_modtrf: string | null
          a3_msblql: string | null
          a3_msexp: string | null
          a3_mun: string | null
          a3_nivel: number | null
          a3_nome: string | null
          a3_nreduz: string | null
          a3_numra: string | null
          a3_nvlstr: string | null
          a3_pais: string | null
          a3_pedfim: string | null
          a3_pedini: string | null
          a3_pen_ali: number | null
          a3_perage: string | null
          a3_perdesc: number | null
          a3_pertaf: string | null
          a3_piscof: string | null
          a3_proxcli: string | null
          a3_proxped: string | null
          a3_qtconta: number | null
          a3_regiao: string | null
          a3_regsla: string | null
          a3_senha: string | null
          a3_sincage: string | null
          a3_sinccon: string | null
          a3_sinctaf: string | null
          a3_snaexg: string | null
          a3_super: string | null
          a3_tel: string | null
          a3_telex: string | null
          a3_timemin: string | null
          a3_tipo: string | null
          a3_tipsup: string | null
          a3_tipvend: string | null
          a3_unidad: string | null
          a3_urlexg: string | null
          a3_userlga: string | null
          a3_userlgi: string | null
          a3_usucorp: string | null
          created_at: string
          d_e_l_e_t: string | null
          id: string
          is_new_record: boolean
          last_sync_id: string | null
          last_synced_at: string | null
          pending_deletion: boolean
          pending_deletion_at: string | null
          previous_record_hash: string | null
          protheus_id: string | null
          r_e_c_d_e_l: number | null
          r_e_c_n_o: number | null
          record_hash: string | null
          record_status:
            | Database["public"]["Enums"]["protheus_record_status"]
            | null
          updated_at: string
          was_updated_last_sync: boolean
        }
        Insert: {
          a3_acrefin?: string | null
          a3_admiss?: string | null
          a3_albaixa?: number | null
          a3_alemiss?: number | null
          a3_bairro?: string | null
          a3_baseir?: string | null
          a3_bco1?: string | null
          a3_biagend?: string | null
          a3_bicont?: string | null
          a3_bitaref?: string | null
          a3_cargo?: string | null
          a3_cel?: string | null
          a3_cep?: string | null
          a3_cgc?: string | null
          a3_clifim?: string | null
          a3_cliini?: string | null
          a3_cod?: string | null
          a3_codiss?: string | null
          a3_codusr?: string | null
          a3_comis?: number | null
          a3_ddd?: string | null
          a3_dddtel?: string | null
          a3_ddi?: string | null
          a3_depend?: string | null
          a3_dia?: number | null
          a3_diarese?: number | null
          a3_dtumov?: string | null
          a3_emacorp?: string | null
          a3_email?: string | null
          a3_end?: string | null
          a3_est?: string | null
          a3_fat_rh?: string | null
          a3_fax?: string | null
          a3_filfun?: string | null
          a3_filial?: string | null
          a3_fornece?: string | null
          a3_frete?: string | null
          a3_gerase2?: string | null
          a3_geren?: string | null
          a3_grprep?: string | null
          a3_grupsan?: string | null
          a3_habsinc?: string | null
          a3_hand?: string | null
          a3_hpage?: string | null
          a3_hrexpo?: string | null
          a3_hrumov?: string | null
          a3_icm?: string | null
          a3_icmsret?: string | null
          a3_inscr?: string | null
          a3_inscrm?: string | null
          a3_ipi?: string | null
          a3_iss?: string | null
          a3_lanexg?: string | null
          a3_loja?: string | null
          a3_modtrf?: string | null
          a3_msblql?: string | null
          a3_msexp?: string | null
          a3_mun?: string | null
          a3_nivel?: number | null
          a3_nome?: string | null
          a3_nreduz?: string | null
          a3_numra?: string | null
          a3_nvlstr?: string | null
          a3_pais?: string | null
          a3_pedfim?: string | null
          a3_pedini?: string | null
          a3_pen_ali?: number | null
          a3_perage?: string | null
          a3_perdesc?: number | null
          a3_pertaf?: string | null
          a3_piscof?: string | null
          a3_proxcli?: string | null
          a3_proxped?: string | null
          a3_qtconta?: number | null
          a3_regiao?: string | null
          a3_regsla?: string | null
          a3_senha?: string | null
          a3_sincage?: string | null
          a3_sinccon?: string | null
          a3_sinctaf?: string | null
          a3_snaexg?: string | null
          a3_super?: string | null
          a3_tel?: string | null
          a3_telex?: string | null
          a3_timemin?: string | null
          a3_tipo?: string | null
          a3_tipsup?: string | null
          a3_tipvend?: string | null
          a3_unidad?: string | null
          a3_urlexg?: string | null
          a3_userlga?: string | null
          a3_userlgi?: string | null
          a3_usucorp?: string | null
          created_at?: string
          d_e_l_e_t?: string | null
          id?: string
          is_new_record?: boolean
          last_sync_id?: string | null
          last_synced_at?: string | null
          pending_deletion?: boolean
          pending_deletion_at?: string | null
          previous_record_hash?: string | null
          protheus_id?: string | null
          r_e_c_d_e_l?: number | null
          r_e_c_n_o?: number | null
          record_hash?: string | null
          record_status?:
            | Database["public"]["Enums"]["protheus_record_status"]
            | null
          updated_at?: string
          was_updated_last_sync?: boolean
        }
        Update: {
          a3_acrefin?: string | null
          a3_admiss?: string | null
          a3_albaixa?: number | null
          a3_alemiss?: number | null
          a3_bairro?: string | null
          a3_baseir?: string | null
          a3_bco1?: string | null
          a3_biagend?: string | null
          a3_bicont?: string | null
          a3_bitaref?: string | null
          a3_cargo?: string | null
          a3_cel?: string | null
          a3_cep?: string | null
          a3_cgc?: string | null
          a3_clifim?: string | null
          a3_cliini?: string | null
          a3_cod?: string | null
          a3_codiss?: string | null
          a3_codusr?: string | null
          a3_comis?: number | null
          a3_ddd?: string | null
          a3_dddtel?: string | null
          a3_ddi?: string | null
          a3_depend?: string | null
          a3_dia?: number | null
          a3_diarese?: number | null
          a3_dtumov?: string | null
          a3_emacorp?: string | null
          a3_email?: string | null
          a3_end?: string | null
          a3_est?: string | null
          a3_fat_rh?: string | null
          a3_fax?: string | null
          a3_filfun?: string | null
          a3_filial?: string | null
          a3_fornece?: string | null
          a3_frete?: string | null
          a3_gerase2?: string | null
          a3_geren?: string | null
          a3_grprep?: string | null
          a3_grupsan?: string | null
          a3_habsinc?: string | null
          a3_hand?: string | null
          a3_hpage?: string | null
          a3_hrexpo?: string | null
          a3_hrumov?: string | null
          a3_icm?: string | null
          a3_icmsret?: string | null
          a3_inscr?: string | null
          a3_inscrm?: string | null
          a3_ipi?: string | null
          a3_iss?: string | null
          a3_lanexg?: string | null
          a3_loja?: string | null
          a3_modtrf?: string | null
          a3_msblql?: string | null
          a3_msexp?: string | null
          a3_mun?: string | null
          a3_nivel?: number | null
          a3_nome?: string | null
          a3_nreduz?: string | null
          a3_numra?: string | null
          a3_nvlstr?: string | null
          a3_pais?: string | null
          a3_pedfim?: string | null
          a3_pedini?: string | null
          a3_pen_ali?: number | null
          a3_perage?: string | null
          a3_perdesc?: number | null
          a3_pertaf?: string | null
          a3_piscof?: string | null
          a3_proxcli?: string | null
          a3_proxped?: string | null
          a3_qtconta?: number | null
          a3_regiao?: string | null
          a3_regsla?: string | null
          a3_senha?: string | null
          a3_sincage?: string | null
          a3_sinccon?: string | null
          a3_sinctaf?: string | null
          a3_snaexg?: string | null
          a3_super?: string | null
          a3_tel?: string | null
          a3_telex?: string | null
          a3_timemin?: string | null
          a3_tipo?: string | null
          a3_tipsup?: string | null
          a3_tipvend?: string | null
          a3_unidad?: string | null
          a3_urlexg?: string | null
          a3_userlga?: string | null
          a3_userlgi?: string | null
          a3_usucorp?: string | null
          created_at?: string
          d_e_l_e_t?: string | null
          id?: string
          is_new_record?: boolean
          last_sync_id?: string | null
          last_synced_at?: string | null
          pending_deletion?: boolean
          pending_deletion_at?: string | null
          previous_record_hash?: string | null
          protheus_id?: string | null
          r_e_c_d_e_l?: number | null
          r_e_c_n_o?: number | null
          record_hash?: string | null
          record_status?:
            | Database["public"]["Enums"]["protheus_record_status"]
            | null
          updated_at?: string
          was_updated_last_sync?: boolean
        }
        Relationships: []
      }
      protheus_sa4010_ea26a13a: {
        Row: {
          a4_antt: string | null
          a4_bairro: string | null
          a4_cep: string | null
          a4_cgc: string | null
          a4_cod: string | null
          a4_cod_mun: string | null
          a4_codpais: string | null
          a4_colig: string | null
          a4_complem: string | null
          a4_contato: string | null
          a4_ddd: string | null
          a4_ddi: string | null
          a4_ecservi: string | null
          a4_email: string | null
          a4_end: string | null
          a4_endnot: string | null
          a4_endpad: string | null
          a4_est: string | null
          a4_estfis: string | null
          a4_filial: string | null
          a4_fomezer: string | null
          a4_hpage: string | null
          a4_idetiq: string | null
          a4_inscrm: string | null
          a4_insest: string | null
          a4_local: string | null
          a4_mun: string | null
          a4_nome: string | null
          a4_nreduz: string | null
          a4_ratfre: string | null
          a4_suframa: string | null
          a4_tel: string | null
          a4_telex: string | null
          a4_tptrans: string | null
          a4_via: string | null
          created_at: string
          d_e_l_e_t: string | null
          id: string
          is_new_record: boolean
          last_sync_id: string | null
          last_synced_at: string | null
          pending_deletion: boolean
          pending_deletion_at: string | null
          previous_record_hash: string | null
          protheus_id: string | null
          r_e_c_d_e_l: number | null
          r_e_c_n_o: number | null
          record_hash: string | null
          record_status:
            | Database["public"]["Enums"]["protheus_record_status"]
            | null
          updated_at: string
          was_updated_last_sync: boolean
        }
        Insert: {
          a4_antt?: string | null
          a4_bairro?: string | null
          a4_cep?: string | null
          a4_cgc?: string | null
          a4_cod?: string | null
          a4_cod_mun?: string | null
          a4_codpais?: string | null
          a4_colig?: string | null
          a4_complem?: string | null
          a4_contato?: string | null
          a4_ddd?: string | null
          a4_ddi?: string | null
          a4_ecservi?: string | null
          a4_email?: string | null
          a4_end?: string | null
          a4_endnot?: string | null
          a4_endpad?: string | null
          a4_est?: string | null
          a4_estfis?: string | null
          a4_filial?: string | null
          a4_fomezer?: string | null
          a4_hpage?: string | null
          a4_idetiq?: string | null
          a4_inscrm?: string | null
          a4_insest?: string | null
          a4_local?: string | null
          a4_mun?: string | null
          a4_nome?: string | null
          a4_nreduz?: string | null
          a4_ratfre?: string | null
          a4_suframa?: string | null
          a4_tel?: string | null
          a4_telex?: string | null
          a4_tptrans?: string | null
          a4_via?: string | null
          created_at?: string
          d_e_l_e_t?: string | null
          id?: string
          is_new_record?: boolean
          last_sync_id?: string | null
          last_synced_at?: string | null
          pending_deletion?: boolean
          pending_deletion_at?: string | null
          previous_record_hash?: string | null
          protheus_id?: string | null
          r_e_c_d_e_l?: number | null
          r_e_c_n_o?: number | null
          record_hash?: string | null
          record_status?:
            | Database["public"]["Enums"]["protheus_record_status"]
            | null
          updated_at?: string
          was_updated_last_sync?: boolean
        }
        Update: {
          a4_antt?: string | null
          a4_bairro?: string | null
          a4_cep?: string | null
          a4_cgc?: string | null
          a4_cod?: string | null
          a4_cod_mun?: string | null
          a4_codpais?: string | null
          a4_colig?: string | null
          a4_complem?: string | null
          a4_contato?: string | null
          a4_ddd?: string | null
          a4_ddi?: string | null
          a4_ecservi?: string | null
          a4_email?: string | null
          a4_end?: string | null
          a4_endnot?: string | null
          a4_endpad?: string | null
          a4_est?: string | null
          a4_estfis?: string | null
          a4_filial?: string | null
          a4_fomezer?: string | null
          a4_hpage?: string | null
          a4_idetiq?: string | null
          a4_inscrm?: string | null
          a4_insest?: string | null
          a4_local?: string | null
          a4_mun?: string | null
          a4_nome?: string | null
          a4_nreduz?: string | null
          a4_ratfre?: string | null
          a4_suframa?: string | null
          a4_tel?: string | null
          a4_telex?: string | null
          a4_tptrans?: string | null
          a4_via?: string | null
          created_at?: string
          d_e_l_e_t?: string | null
          id?: string
          is_new_record?: boolean
          last_sync_id?: string | null
          last_synced_at?: string | null
          pending_deletion?: boolean
          pending_deletion_at?: string | null
          previous_record_hash?: string | null
          protheus_id?: string | null
          r_e_c_d_e_l?: number | null
          r_e_c_n_o?: number | null
          record_hash?: string | null
          record_status?:
            | Database["public"]["Enums"]["protheus_record_status"]
            | null
          updated_at?: string
          was_updated_last_sync?: boolean
        }
        Relationships: []
      }
      protheus_sa5010_6d3daa8e: {
        Row: {
          a5_atual: string | null
          a5_ccusto: string | null
          a5_chave: string | null
          a5_cno: string | null
          a5_codbar: string | null
          a5_codfis: string | null
          a5_codprca: string | null
          a5_codprf: string | null
          a5_codtab: string | null
          a5_cond01: string | null
          a5_cond02: string | null
          a5_cond03: string | null
          a5_cond04: string | null
          a5_cond05: string | null
          a5_cond06: string | null
          a5_cond07: string | null
          a5_cond08: string | null
          a5_cond09: string | null
          a5_cond10: string | null
          a5_cond11: string | null
          a5_cond12: string | null
          a5_descprf: string | null
          a5_desref: string | null
          a5_diassit: number | null
          a5_dtcom01: string | null
          a5_dtcom02: string | null
          a5_dtcom03: string | null
          a5_dtcom04: string | null
          a5_dtcom05: string | null
          a5_dtcom06: string | null
          a5_dtcom07: string | null
          a5_dtcom08: string | null
          a5_dtcom09: string | null
          a5_dtcom10: string | null
          a5_dtcom11: string | null
          a5_dtcom12: string | null
          a5_dtriai: string | null
          a5_entrega: number | null
          a5_entsit: number | null
          a5_fabr: string | null
          a5_fabrev: string | null
          a5_faloja: string | null
          a5_filial: string | null
          a5_fornece: string | null
          a5_incoter: string | null
          a5_lead_t: number | null
          a5_loja: string | null
          a5_lotemin: number | null
          a5_lotemul: number | null
          a5_moe_us: string | null
          a5_ncmprf: string | null
          a5_nivel1: string | null
          a5_nivel2: string | null
          a5_nomefor: string | null
          a5_nomprod: string | null
          a5_nota: number | null
          a5_nqa1: string | null
          a5_nqa2: string | null
          a5_partopc: string | null
          a5_pe: number | null
          a5_peso: number | null
          a5_plam1: string | null
          a5_plam2: string | null
          a5_preco01: number | null
          a5_preco02: number | null
          a5_preco03: number | null
          a5_preco04: number | null
          a5_preco05: number | null
          a5_preco06: number | null
          a5_preco07: number | null
          a5_preco08: number | null
          a5_preco09: number | null
          a5_preco10: number | null
          a5_preco11: number | null
          a5_preco12: number | null
          a5_produto: string | null
          a5_qt_cot: number | null
          a5_quant01: number | null
          a5_quant02: number | null
          a5_quant03: number | null
          a5_quant04: number | null
          a5_quant05: number | null
          a5_quant06: number | null
          a5_quant07: number | null
          a5_quant08: number | null
          a5_quant09: number | null
          a5_quant10: number | null
          a5_quant11: number | null
          a5_quant12: number | null
          a5_refgrd: string | null
          a5_riai: string | null
          a5_situ: string | null
          a5_skiplot: number | null
          a5_skplot: string | null
          a5_status: string | null
          a5_templim: number | null
          a5_temptra: number | null
          a5_tesbp: string | null
          a5_tescp: string | null
          a5_tipatu: string | null
          a5_tipe: string | null
          a5_tipocot: string | null
          a5_toledif: number | null
          a5_tr_cost: number | null
          a5_ult_ent: string | null
          a5_ult_fob: number | null
          a5_umnfe: string | null
          a5_unid: string | null
          a5_valriai: string | null
          a5_vlcotus: number | null
          a5_volmax: number | null
          created_at: string
          d_e_l_e_t: string | null
          id: string
          is_new_record: boolean
          last_sync_id: string | null
          last_synced_at: string | null
          pending_deletion: boolean
          pending_deletion_at: string | null
          previous_record_hash: string | null
          protheus_id: string | null
          r_e_c_d_e_l: number | null
          r_e_c_n_o: number | null
          record_hash: string | null
          updated_at: string
          was_updated_last_sync: boolean
        }
        Insert: {
          a5_atual?: string | null
          a5_ccusto?: string | null
          a5_chave?: string | null
          a5_cno?: string | null
          a5_codbar?: string | null
          a5_codfis?: string | null
          a5_codprca?: string | null
          a5_codprf?: string | null
          a5_codtab?: string | null
          a5_cond01?: string | null
          a5_cond02?: string | null
          a5_cond03?: string | null
          a5_cond04?: string | null
          a5_cond05?: string | null
          a5_cond06?: string | null
          a5_cond07?: string | null
          a5_cond08?: string | null
          a5_cond09?: string | null
          a5_cond10?: string | null
          a5_cond11?: string | null
          a5_cond12?: string | null
          a5_descprf?: string | null
          a5_desref?: string | null
          a5_diassit?: number | null
          a5_dtcom01?: string | null
          a5_dtcom02?: string | null
          a5_dtcom03?: string | null
          a5_dtcom04?: string | null
          a5_dtcom05?: string | null
          a5_dtcom06?: string | null
          a5_dtcom07?: string | null
          a5_dtcom08?: string | null
          a5_dtcom09?: string | null
          a5_dtcom10?: string | null
          a5_dtcom11?: string | null
          a5_dtcom12?: string | null
          a5_dtriai?: string | null
          a5_entrega?: number | null
          a5_entsit?: number | null
          a5_fabr?: string | null
          a5_fabrev?: string | null
          a5_faloja?: string | null
          a5_filial?: string | null
          a5_fornece?: string | null
          a5_incoter?: string | null
          a5_lead_t?: number | null
          a5_loja?: string | null
          a5_lotemin?: number | null
          a5_lotemul?: number | null
          a5_moe_us?: string | null
          a5_ncmprf?: string | null
          a5_nivel1?: string | null
          a5_nivel2?: string | null
          a5_nomefor?: string | null
          a5_nomprod?: string | null
          a5_nota?: number | null
          a5_nqa1?: string | null
          a5_nqa2?: string | null
          a5_partopc?: string | null
          a5_pe?: number | null
          a5_peso?: number | null
          a5_plam1?: string | null
          a5_plam2?: string | null
          a5_preco01?: number | null
          a5_preco02?: number | null
          a5_preco03?: number | null
          a5_preco04?: number | null
          a5_preco05?: number | null
          a5_preco06?: number | null
          a5_preco07?: number | null
          a5_preco08?: number | null
          a5_preco09?: number | null
          a5_preco10?: number | null
          a5_preco11?: number | null
          a5_preco12?: number | null
          a5_produto?: string | null
          a5_qt_cot?: number | null
          a5_quant01?: number | null
          a5_quant02?: number | null
          a5_quant03?: number | null
          a5_quant04?: number | null
          a5_quant05?: number | null
          a5_quant06?: number | null
          a5_quant07?: number | null
          a5_quant08?: number | null
          a5_quant09?: number | null
          a5_quant10?: number | null
          a5_quant11?: number | null
          a5_quant12?: number | null
          a5_refgrd?: string | null
          a5_riai?: string | null
          a5_situ?: string | null
          a5_skiplot?: number | null
          a5_skplot?: string | null
          a5_status?: string | null
          a5_templim?: number | null
          a5_temptra?: number | null
          a5_tesbp?: string | null
          a5_tescp?: string | null
          a5_tipatu?: string | null
          a5_tipe?: string | null
          a5_tipocot?: string | null
          a5_toledif?: number | null
          a5_tr_cost?: number | null
          a5_ult_ent?: string | null
          a5_ult_fob?: number | null
          a5_umnfe?: string | null
          a5_unid?: string | null
          a5_valriai?: string | null
          a5_vlcotus?: number | null
          a5_volmax?: number | null
          created_at?: string
          d_e_l_e_t?: string | null
          id?: string
          is_new_record?: boolean
          last_sync_id?: string | null
          last_synced_at?: string | null
          pending_deletion?: boolean
          pending_deletion_at?: string | null
          previous_record_hash?: string | null
          protheus_id?: string | null
          r_e_c_d_e_l?: number | null
          r_e_c_n_o?: number | null
          record_hash?: string | null
          updated_at?: string
          was_updated_last_sync?: boolean
        }
        Update: {
          a5_atual?: string | null
          a5_ccusto?: string | null
          a5_chave?: string | null
          a5_cno?: string | null
          a5_codbar?: string | null
          a5_codfis?: string | null
          a5_codprca?: string | null
          a5_codprf?: string | null
          a5_codtab?: string | null
          a5_cond01?: string | null
          a5_cond02?: string | null
          a5_cond03?: string | null
          a5_cond04?: string | null
          a5_cond05?: string | null
          a5_cond06?: string | null
          a5_cond07?: string | null
          a5_cond08?: string | null
          a5_cond09?: string | null
          a5_cond10?: string | null
          a5_cond11?: string | null
          a5_cond12?: string | null
          a5_descprf?: string | null
          a5_desref?: string | null
          a5_diassit?: number | null
          a5_dtcom01?: string | null
          a5_dtcom02?: string | null
          a5_dtcom03?: string | null
          a5_dtcom04?: string | null
          a5_dtcom05?: string | null
          a5_dtcom06?: string | null
          a5_dtcom07?: string | null
          a5_dtcom08?: string | null
          a5_dtcom09?: string | null
          a5_dtcom10?: string | null
          a5_dtcom11?: string | null
          a5_dtcom12?: string | null
          a5_dtriai?: string | null
          a5_entrega?: number | null
          a5_entsit?: number | null
          a5_fabr?: string | null
          a5_fabrev?: string | null
          a5_faloja?: string | null
          a5_filial?: string | null
          a5_fornece?: string | null
          a5_incoter?: string | null
          a5_lead_t?: number | null
          a5_loja?: string | null
          a5_lotemin?: number | null
          a5_lotemul?: number | null
          a5_moe_us?: string | null
          a5_ncmprf?: string | null
          a5_nivel1?: string | null
          a5_nivel2?: string | null
          a5_nomefor?: string | null
          a5_nomprod?: string | null
          a5_nota?: number | null
          a5_nqa1?: string | null
          a5_nqa2?: string | null
          a5_partopc?: string | null
          a5_pe?: number | null
          a5_peso?: number | null
          a5_plam1?: string | null
          a5_plam2?: string | null
          a5_preco01?: number | null
          a5_preco02?: number | null
          a5_preco03?: number | null
          a5_preco04?: number | null
          a5_preco05?: number | null
          a5_preco06?: number | null
          a5_preco07?: number | null
          a5_preco08?: number | null
          a5_preco09?: number | null
          a5_preco10?: number | null
          a5_preco11?: number | null
          a5_preco12?: number | null
          a5_produto?: string | null
          a5_qt_cot?: number | null
          a5_quant01?: number | null
          a5_quant02?: number | null
          a5_quant03?: number | null
          a5_quant04?: number | null
          a5_quant05?: number | null
          a5_quant06?: number | null
          a5_quant07?: number | null
          a5_quant08?: number | null
          a5_quant09?: number | null
          a5_quant10?: number | null
          a5_quant11?: number | null
          a5_quant12?: number | null
          a5_refgrd?: string | null
          a5_riai?: string | null
          a5_situ?: string | null
          a5_skiplot?: number | null
          a5_skplot?: string | null
          a5_status?: string | null
          a5_templim?: number | null
          a5_temptra?: number | null
          a5_tesbp?: string | null
          a5_tescp?: string | null
          a5_tipatu?: string | null
          a5_tipe?: string | null
          a5_tipocot?: string | null
          a5_toledif?: number | null
          a5_tr_cost?: number | null
          a5_ult_ent?: string | null
          a5_ult_fob?: number | null
          a5_umnfe?: string | null
          a5_unid?: string | null
          a5_valriai?: string | null
          a5_vlcotus?: number | null
          a5_volmax?: number | null
          created_at?: string
          d_e_l_e_t?: string | null
          id?: string
          is_new_record?: boolean
          last_sync_id?: string | null
          last_synced_at?: string | null
          pending_deletion?: boolean
          pending_deletion_at?: string | null
          previous_record_hash?: string | null
          protheus_id?: string | null
          r_e_c_d_e_l?: number | null
          r_e_c_n_o?: number | null
          record_hash?: string | null
          updated_at?: string
          was_updated_last_sync?: boolean
        }
        Relationships: []
      }
      protheus_sb1010_b0316113: {
        Row: {
          b1_admin: string | null
          b1_afabov: number | null
          b1_afacs: number | null
          b1_afamad: number | null
          b1_afasemt: number | null
          b1_afethab: number | null
          b1_afundes: number | null
          b1_agregcu: string | null
          b1_aimamt: number | null
          b1_ajudif: string | null
          b1_aladi: string | null
          b1_alfecop: number | null
          b1_alfecrn: number | null
          b1_alfecst: number | null
          b1_alfumac: number | null
          b1_aliqiss: number | null
          b1_alter: string | null
          b1_anuente: string | null
          b1_apopro: string | null
          b1_apropri: string | null
          b1_ativo: string | null
          b1_atrib1: string | null
          b1_atrib2: string | null
          b1_atrib3: string | null
          b1_balanca: string | null
          b1_base: string | null
          b1_base2: string | null
          b1_base3: string | null
          b1_bitmap: string | null
          b1_calcfet: string | null
          b1_cargae: string | null
          b1_cc: string | null
          b1_cccusto: string | null
          b1_cest: string | null
          b1_cfem: string | null
          b1_cfema: number | null
          b1_cfems: string | null
          b1_chassi: string | null
          b1_clasfis: string | null
          b1_classe: string | null
          b1_classve: string | null
          b1_clvl: string | null
          b1_cnae: string | null
          b1_cnatrec: string | null
          b1_cod: string | null
          b1_codant: string | null
          b1_codbar: string | null
          b1_codemb: string | null
          b1_codgtin: string | null
          b1_codiss: string | null
          b1_codite: string | null
          b1_codlan: string | null
          b1_codnor: string | null
          b1_codobs: string | null
          b1_codproc: string | null
          b1_codqad: string | null
          b1_coefdcr: number | null
          b1_cofins: string | null
          b1_color: string | null
          b1_comis: number | null
          b1_conini: string | null
          b1_conta: string | null
          b1_contcqp: number | null
          b1_contrat: string | null
          b1_contsoc: string | null
          b1_conv: number | null
          b1_corpri: string | null
          b1_corsec: string | null
          b1_cpotenc: string | null
          b1_crdest: number | null
          b1_crdpres: number | null
          b1_cricms: string | null
          b1_cricmst: string | null
          b1_csll: string | null
          b1_custd: number | null
          b1_datasub: string | null
          b1_datref: string | null
          b1_dci: string | null
          b1_dcr: string | null
          b1_dcre: string | null
          b1_dcrii: number | null
          b1_desbse2: string | null
          b1_desbse3: string | null
          b1_desc: string | null
          b1_desc_gi: string | null
          b1_desc_i: string | null
          b1_desc_p: string | null
          b1_despimp: string | null
          b1_difcnae: string | null
          b1_dtcorte: string | null
          b1_dtfimnt: string | null
          b1_dtrefp1: string | null
          b1_edicao: string | null
          b1_emax: number | null
          b1_emin: number | null
          b1_envobr: string | null
          b1_escripi: string | null
          b1_especie: string | null
          b1_especif: string | null
          b1_estfor: string | null
          b1_estrori: string | null
          b1_estseg: number | null
          b1_ex_nbm: string | null
          b1_ex_ncm: string | null
          b1_fabric: string | null
          b1_faixas: number | null
          b1_familia: string | null
          b1_fantasm: string | null
          b1_fecop: string | null
          b1_fecp: number | null
          b1_fecpba: number | null
          b1_fethab: string | null
          b1_filial: string | null
          b1_flagsug: string | null
          b1_foraest: string | null
          b1_formlot: string | null
          b1_forprz: string | null
          b1_fpcod: string | null
          b1_fracper: number | null
          b1_fretiss: string | null
          b1_fustf: string | null
          b1_garant: string | null
          b1_gccusto: string | null
          b1_gdodif: string | null
          b1_grade: string | null
          b1_grpcst: string | null
          b1_grpnatr: string | null
          b1_grpti: string | null
          b1_grtrib: string | null
          b1_grudes: string | null
          b1_grupcom: string | null
          b1_grupo: string | null
          b1_hrexpo: string | null
          b1_iat: string | null
          b1_idhist: string | null
          b1_impncm: number | null
          b1_import: string | null
          b1_impzfrc: string | null
          b1_inss: string | null
          b1_int_icm: number | null
          b1_integ: string | null
          b1_ipi: number | null
          b1_ippt: string | null
          b1_irrf: string | null
          b1_isbn: string | null
          b1_itemcc: string | null
          b1_ivaaju: string | null
          b1_le: number | null
          b1_lingua: string | null
          b1_lm: number | null
          b1_localiz: string | null
          b1_locpad: string | null
          b1_lojproc: string | null
          b1_lotesbp: number | null
          b1_lotven: number | null
          b1_markup: number | null
          b1_mat_pri: string | null
          b1_mcustd: string | null
          b1_meples: string | null
          b1_midia: string | null
          b1_modelo: string | null
          b1_mono: string | null
          b1_mopc: string | null
          b1_mrp: string | null
          b1_msblql: string | null
          b1_msexp: string | null
          b1_mtbf: number | null
          b1_mttr: number | null
          b1_nalncca: string | null
          b1_nalsh: string | null
          b1_nicone: string | null
          b1_notamin: number | null
          b1_nropag: number | null
          b1_numcop: number | null
          b1_numcqpr: number | null
          b1_obsisbn: string | null
          b1_ok: string | null
          b1_opc: string | null
          b1_operpad: string | null
          b1_origem: string | null
          b1_pafmd5: string | null
          b1_parcei: string | null
          b1_pautfet: number | null
          b1_pcofins: number | null
          b1_pcsll: number | null
          b1_pe: number | null
          b1_pergart: number | null
          b1_perinv: number | null
          b1_pesbru: number | null
          b1_peso: number | null
          b1_picm: number | null
          b1_picment: number | null
          b1_picmret: number | null
          b1_pis: string | null
          b1_pmacnut: number | null
          b1_pmicnut: number | null
          b1_porcprl: string | null
          b1_posipi: string | null
          b1_potenci: number | null
          b1_ppis: number | null
          b1_pr43080: number | null
          b1_prdori: string | null
          b1_prfdsul: number | null
          b1_princmg: number | null
          b1_prn944i: string | null
          b1_proc: string | null
          b1_prodpai: string | null
          b1_prodrec: string | null
          b1_prodsbp: string | null
          b1_prv1: number | null
          b1_prvalid: number | null
          b1_qb: number | null
          b1_qbp: number | null
          b1_qe: number | null
          b1_qtdacum: number | null
          b1_qtdinic: number | null
          b1_qtdser: string | null
          b1_qtmidia: number | null
          b1_quadpro: string | null
          b1_rastro: string | null
          b1_redcof: number | null
          b1_redinss: number | null
          b1_redirrf: number | null
          b1_redpis: number | null
          b1_refbas: string | null
          b1_regesim: string | null
          b1_regriss: string | null
          b1_regseq: string | null
          b1_requis: string | null
          b1_retoper: string | null
          b1_revatu: string | null
          b1_ricm65: string | null
          b1_rprodep: string | null
          b1_rsativo: string | null
          b1_segum: string | null
          b1_selo: string | null
          b1_seloen: string | null
          b1_serie: string | null
          b1_setor: string | null
          b1_sitprod: string | null
          b1_sittrib: string | null
          b1_solicit: string | null
          b1_tab_ipi: string | null
          b1_talla: string | null
          b1_te: string | null
          b1_tecla: string | null
          b1_terum: string | null
          b1_tfethab: string | null
          b1_tipcar: string | null
          b1_tipconv: string | null
          b1_tipe: string | null
          b1_tipo: string | null
          b1_tipobn: string | null
          b1_tipocq: string | null
          b1_tipodec: string | null
          b1_tipvec: string | null
          b1_titorig: string | null
          b1_tnatrec: string | null
          b1_toler: number | null
          b1_tpdp: string | null
          b1_tpprod: string | null
          b1_tpreg: string | null
          b1_tribmun: string | null
          b1_ts: string | null
          b1_ucalstd: string | null
          b1_ucom: string | null
          b1_um: string | null
          b1_umoec: number | null
          b1_uprc: number | null
          b1_urev: string | null
          b1_usafefo: string | null
          b1_userlga: string | null
          b1_userlgi: string | null
          b1_uvlrc: number | null
          b1_valepre: string | null
          b1_verean: string | null
          b1_vigenc: string | null
          b1_vlcif: number | null
          b1_vlr_cof: number | null
          b1_vlr_icm: number | null
          b1_vlr_ipi: number | null
          b1_vlr_pis: number | null
          b1_vlrefus: number | null
          b1_vlrselo: number | null
          b1_zzclass: string | null
          b1_zzdeses: string | null
          b1_zzdesin: string | null
          b1_zzgrau: string | null
          b1_zzgrctb: string | null
          b1_zzlote: string | null
          b1_zzmen1: string | null
          b1_zzmens: string | null
          b1_zzperig: string | null
          created_at: string
          d_e_l_e_t: string | null
          id: string
          is_new_record: boolean
          last_sync_id: string | null
          last_synced_at: string | null
          pending_deletion: boolean
          pending_deletion_at: string | null
          previous_record_hash: string | null
          protheus_id: string | null
          r_e_c_d_e_l: number | null
          r_e_c_n_o: number | null
          record_hash: string | null
          updated_at: string
          was_updated_last_sync: boolean
        }
        Insert: {
          b1_admin?: string | null
          b1_afabov?: number | null
          b1_afacs?: number | null
          b1_afamad?: number | null
          b1_afasemt?: number | null
          b1_afethab?: number | null
          b1_afundes?: number | null
          b1_agregcu?: string | null
          b1_aimamt?: number | null
          b1_ajudif?: string | null
          b1_aladi?: string | null
          b1_alfecop?: number | null
          b1_alfecrn?: number | null
          b1_alfecst?: number | null
          b1_alfumac?: number | null
          b1_aliqiss?: number | null
          b1_alter?: string | null
          b1_anuente?: string | null
          b1_apopro?: string | null
          b1_apropri?: string | null
          b1_ativo?: string | null
          b1_atrib1?: string | null
          b1_atrib2?: string | null
          b1_atrib3?: string | null
          b1_balanca?: string | null
          b1_base?: string | null
          b1_base2?: string | null
          b1_base3?: string | null
          b1_bitmap?: string | null
          b1_calcfet?: string | null
          b1_cargae?: string | null
          b1_cc?: string | null
          b1_cccusto?: string | null
          b1_cest?: string | null
          b1_cfem?: string | null
          b1_cfema?: number | null
          b1_cfems?: string | null
          b1_chassi?: string | null
          b1_clasfis?: string | null
          b1_classe?: string | null
          b1_classve?: string | null
          b1_clvl?: string | null
          b1_cnae?: string | null
          b1_cnatrec?: string | null
          b1_cod?: string | null
          b1_codant?: string | null
          b1_codbar?: string | null
          b1_codemb?: string | null
          b1_codgtin?: string | null
          b1_codiss?: string | null
          b1_codite?: string | null
          b1_codlan?: string | null
          b1_codnor?: string | null
          b1_codobs?: string | null
          b1_codproc?: string | null
          b1_codqad?: string | null
          b1_coefdcr?: number | null
          b1_cofins?: string | null
          b1_color?: string | null
          b1_comis?: number | null
          b1_conini?: string | null
          b1_conta?: string | null
          b1_contcqp?: number | null
          b1_contrat?: string | null
          b1_contsoc?: string | null
          b1_conv?: number | null
          b1_corpri?: string | null
          b1_corsec?: string | null
          b1_cpotenc?: string | null
          b1_crdest?: number | null
          b1_crdpres?: number | null
          b1_cricms?: string | null
          b1_cricmst?: string | null
          b1_csll?: string | null
          b1_custd?: number | null
          b1_datasub?: string | null
          b1_datref?: string | null
          b1_dci?: string | null
          b1_dcr?: string | null
          b1_dcre?: string | null
          b1_dcrii?: number | null
          b1_desbse2?: string | null
          b1_desbse3?: string | null
          b1_desc?: string | null
          b1_desc_gi?: string | null
          b1_desc_i?: string | null
          b1_desc_p?: string | null
          b1_despimp?: string | null
          b1_difcnae?: string | null
          b1_dtcorte?: string | null
          b1_dtfimnt?: string | null
          b1_dtrefp1?: string | null
          b1_edicao?: string | null
          b1_emax?: number | null
          b1_emin?: number | null
          b1_envobr?: string | null
          b1_escripi?: string | null
          b1_especie?: string | null
          b1_especif?: string | null
          b1_estfor?: string | null
          b1_estrori?: string | null
          b1_estseg?: number | null
          b1_ex_nbm?: string | null
          b1_ex_ncm?: string | null
          b1_fabric?: string | null
          b1_faixas?: number | null
          b1_familia?: string | null
          b1_fantasm?: string | null
          b1_fecop?: string | null
          b1_fecp?: number | null
          b1_fecpba?: number | null
          b1_fethab?: string | null
          b1_filial?: string | null
          b1_flagsug?: string | null
          b1_foraest?: string | null
          b1_formlot?: string | null
          b1_forprz?: string | null
          b1_fpcod?: string | null
          b1_fracper?: number | null
          b1_fretiss?: string | null
          b1_fustf?: string | null
          b1_garant?: string | null
          b1_gccusto?: string | null
          b1_gdodif?: string | null
          b1_grade?: string | null
          b1_grpcst?: string | null
          b1_grpnatr?: string | null
          b1_grpti?: string | null
          b1_grtrib?: string | null
          b1_grudes?: string | null
          b1_grupcom?: string | null
          b1_grupo?: string | null
          b1_hrexpo?: string | null
          b1_iat?: string | null
          b1_idhist?: string | null
          b1_impncm?: number | null
          b1_import?: string | null
          b1_impzfrc?: string | null
          b1_inss?: string | null
          b1_int_icm?: number | null
          b1_integ?: string | null
          b1_ipi?: number | null
          b1_ippt?: string | null
          b1_irrf?: string | null
          b1_isbn?: string | null
          b1_itemcc?: string | null
          b1_ivaaju?: string | null
          b1_le?: number | null
          b1_lingua?: string | null
          b1_lm?: number | null
          b1_localiz?: string | null
          b1_locpad?: string | null
          b1_lojproc?: string | null
          b1_lotesbp?: number | null
          b1_lotven?: number | null
          b1_markup?: number | null
          b1_mat_pri?: string | null
          b1_mcustd?: string | null
          b1_meples?: string | null
          b1_midia?: string | null
          b1_modelo?: string | null
          b1_mono?: string | null
          b1_mopc?: string | null
          b1_mrp?: string | null
          b1_msblql?: string | null
          b1_msexp?: string | null
          b1_mtbf?: number | null
          b1_mttr?: number | null
          b1_nalncca?: string | null
          b1_nalsh?: string | null
          b1_nicone?: string | null
          b1_notamin?: number | null
          b1_nropag?: number | null
          b1_numcop?: number | null
          b1_numcqpr?: number | null
          b1_obsisbn?: string | null
          b1_ok?: string | null
          b1_opc?: string | null
          b1_operpad?: string | null
          b1_origem?: string | null
          b1_pafmd5?: string | null
          b1_parcei?: string | null
          b1_pautfet?: number | null
          b1_pcofins?: number | null
          b1_pcsll?: number | null
          b1_pe?: number | null
          b1_pergart?: number | null
          b1_perinv?: number | null
          b1_pesbru?: number | null
          b1_peso?: number | null
          b1_picm?: number | null
          b1_picment?: number | null
          b1_picmret?: number | null
          b1_pis?: string | null
          b1_pmacnut?: number | null
          b1_pmicnut?: number | null
          b1_porcprl?: string | null
          b1_posipi?: string | null
          b1_potenci?: number | null
          b1_ppis?: number | null
          b1_pr43080?: number | null
          b1_prdori?: string | null
          b1_prfdsul?: number | null
          b1_princmg?: number | null
          b1_prn944i?: string | null
          b1_proc?: string | null
          b1_prodpai?: string | null
          b1_prodrec?: string | null
          b1_prodsbp?: string | null
          b1_prv1?: number | null
          b1_prvalid?: number | null
          b1_qb?: number | null
          b1_qbp?: number | null
          b1_qe?: number | null
          b1_qtdacum?: number | null
          b1_qtdinic?: number | null
          b1_qtdser?: string | null
          b1_qtmidia?: number | null
          b1_quadpro?: string | null
          b1_rastro?: string | null
          b1_redcof?: number | null
          b1_redinss?: number | null
          b1_redirrf?: number | null
          b1_redpis?: number | null
          b1_refbas?: string | null
          b1_regesim?: string | null
          b1_regriss?: string | null
          b1_regseq?: string | null
          b1_requis?: string | null
          b1_retoper?: string | null
          b1_revatu?: string | null
          b1_ricm65?: string | null
          b1_rprodep?: string | null
          b1_rsativo?: string | null
          b1_segum?: string | null
          b1_selo?: string | null
          b1_seloen?: string | null
          b1_serie?: string | null
          b1_setor?: string | null
          b1_sitprod?: string | null
          b1_sittrib?: string | null
          b1_solicit?: string | null
          b1_tab_ipi?: string | null
          b1_talla?: string | null
          b1_te?: string | null
          b1_tecla?: string | null
          b1_terum?: string | null
          b1_tfethab?: string | null
          b1_tipcar?: string | null
          b1_tipconv?: string | null
          b1_tipe?: string | null
          b1_tipo?: string | null
          b1_tipobn?: string | null
          b1_tipocq?: string | null
          b1_tipodec?: string | null
          b1_tipvec?: string | null
          b1_titorig?: string | null
          b1_tnatrec?: string | null
          b1_toler?: number | null
          b1_tpdp?: string | null
          b1_tpprod?: string | null
          b1_tpreg?: string | null
          b1_tribmun?: string | null
          b1_ts?: string | null
          b1_ucalstd?: string | null
          b1_ucom?: string | null
          b1_um?: string | null
          b1_umoec?: number | null
          b1_uprc?: number | null
          b1_urev?: string | null
          b1_usafefo?: string | null
          b1_userlga?: string | null
          b1_userlgi?: string | null
          b1_uvlrc?: number | null
          b1_valepre?: string | null
          b1_verean?: string | null
          b1_vigenc?: string | null
          b1_vlcif?: number | null
          b1_vlr_cof?: number | null
          b1_vlr_icm?: number | null
          b1_vlr_ipi?: number | null
          b1_vlr_pis?: number | null
          b1_vlrefus?: number | null
          b1_vlrselo?: number | null
          b1_zzclass?: string | null
          b1_zzdeses?: string | null
          b1_zzdesin?: string | null
          b1_zzgrau?: string | null
          b1_zzgrctb?: string | null
          b1_zzlote?: string | null
          b1_zzmen1?: string | null
          b1_zzmens?: string | null
          b1_zzperig?: string | null
          created_at?: string
          d_e_l_e_t?: string | null
          id?: string
          is_new_record?: boolean
          last_sync_id?: string | null
          last_synced_at?: string | null
          pending_deletion?: boolean
          pending_deletion_at?: string | null
          previous_record_hash?: string | null
          protheus_id?: string | null
          r_e_c_d_e_l?: number | null
          r_e_c_n_o?: number | null
          record_hash?: string | null
          updated_at?: string
          was_updated_last_sync?: boolean
        }
        Update: {
          b1_admin?: string | null
          b1_afabov?: number | null
          b1_afacs?: number | null
          b1_afamad?: number | null
          b1_afasemt?: number | null
          b1_afethab?: number | null
          b1_afundes?: number | null
          b1_agregcu?: string | null
          b1_aimamt?: number | null
          b1_ajudif?: string | null
          b1_aladi?: string | null
          b1_alfecop?: number | null
          b1_alfecrn?: number | null
          b1_alfecst?: number | null
          b1_alfumac?: number | null
          b1_aliqiss?: number | null
          b1_alter?: string | null
          b1_anuente?: string | null
          b1_apopro?: string | null
          b1_apropri?: string | null
          b1_ativo?: string | null
          b1_atrib1?: string | null
          b1_atrib2?: string | null
          b1_atrib3?: string | null
          b1_balanca?: string | null
          b1_base?: string | null
          b1_base2?: string | null
          b1_base3?: string | null
          b1_bitmap?: string | null
          b1_calcfet?: string | null
          b1_cargae?: string | null
          b1_cc?: string | null
          b1_cccusto?: string | null
          b1_cest?: string | null
          b1_cfem?: string | null
          b1_cfema?: number | null
          b1_cfems?: string | null
          b1_chassi?: string | null
          b1_clasfis?: string | null
          b1_classe?: string | null
          b1_classve?: string | null
          b1_clvl?: string | null
          b1_cnae?: string | null
          b1_cnatrec?: string | null
          b1_cod?: string | null
          b1_codant?: string | null
          b1_codbar?: string | null
          b1_codemb?: string | null
          b1_codgtin?: string | null
          b1_codiss?: string | null
          b1_codite?: string | null
          b1_codlan?: string | null
          b1_codnor?: string | null
          b1_codobs?: string | null
          b1_codproc?: string | null
          b1_codqad?: string | null
          b1_coefdcr?: number | null
          b1_cofins?: string | null
          b1_color?: string | null
          b1_comis?: number | null
          b1_conini?: string | null
          b1_conta?: string | null
          b1_contcqp?: number | null
          b1_contrat?: string | null
          b1_contsoc?: string | null
          b1_conv?: number | null
          b1_corpri?: string | null
          b1_corsec?: string | null
          b1_cpotenc?: string | null
          b1_crdest?: number | null
          b1_crdpres?: number | null
          b1_cricms?: string | null
          b1_cricmst?: string | null
          b1_csll?: string | null
          b1_custd?: number | null
          b1_datasub?: string | null
          b1_datref?: string | null
          b1_dci?: string | null
          b1_dcr?: string | null
          b1_dcre?: string | null
          b1_dcrii?: number | null
          b1_desbse2?: string | null
          b1_desbse3?: string | null
          b1_desc?: string | null
          b1_desc_gi?: string | null
          b1_desc_i?: string | null
          b1_desc_p?: string | null
          b1_despimp?: string | null
          b1_difcnae?: string | null
          b1_dtcorte?: string | null
          b1_dtfimnt?: string | null
          b1_dtrefp1?: string | null
          b1_edicao?: string | null
          b1_emax?: number | null
          b1_emin?: number | null
          b1_envobr?: string | null
          b1_escripi?: string | null
          b1_especie?: string | null
          b1_especif?: string | null
          b1_estfor?: string | null
          b1_estrori?: string | null
          b1_estseg?: number | null
          b1_ex_nbm?: string | null
          b1_ex_ncm?: string | null
          b1_fabric?: string | null
          b1_faixas?: number | null
          b1_familia?: string | null
          b1_fantasm?: string | null
          b1_fecop?: string | null
          b1_fecp?: number | null
          b1_fecpba?: number | null
          b1_fethab?: string | null
          b1_filial?: string | null
          b1_flagsug?: string | null
          b1_foraest?: string | null
          b1_formlot?: string | null
          b1_forprz?: string | null
          b1_fpcod?: string | null
          b1_fracper?: number | null
          b1_fretiss?: string | null
          b1_fustf?: string | null
          b1_garant?: string | null
          b1_gccusto?: string | null
          b1_gdodif?: string | null
          b1_grade?: string | null
          b1_grpcst?: string | null
          b1_grpnatr?: string | null
          b1_grpti?: string | null
          b1_grtrib?: string | null
          b1_grudes?: string | null
          b1_grupcom?: string | null
          b1_grupo?: string | null
          b1_hrexpo?: string | null
          b1_iat?: string | null
          b1_idhist?: string | null
          b1_impncm?: number | null
          b1_import?: string | null
          b1_impzfrc?: string | null
          b1_inss?: string | null
          b1_int_icm?: number | null
          b1_integ?: string | null
          b1_ipi?: number | null
          b1_ippt?: string | null
          b1_irrf?: string | null
          b1_isbn?: string | null
          b1_itemcc?: string | null
          b1_ivaaju?: string | null
          b1_le?: number | null
          b1_lingua?: string | null
          b1_lm?: number | null
          b1_localiz?: string | null
          b1_locpad?: string | null
          b1_lojproc?: string | null
          b1_lotesbp?: number | null
          b1_lotven?: number | null
          b1_markup?: number | null
          b1_mat_pri?: string | null
          b1_mcustd?: string | null
          b1_meples?: string | null
          b1_midia?: string | null
          b1_modelo?: string | null
          b1_mono?: string | null
          b1_mopc?: string | null
          b1_mrp?: string | null
          b1_msblql?: string | null
          b1_msexp?: string | null
          b1_mtbf?: number | null
          b1_mttr?: number | null
          b1_nalncca?: string | null
          b1_nalsh?: string | null
          b1_nicone?: string | null
          b1_notamin?: number | null
          b1_nropag?: number | null
          b1_numcop?: number | null
          b1_numcqpr?: number | null
          b1_obsisbn?: string | null
          b1_ok?: string | null
          b1_opc?: string | null
          b1_operpad?: string | null
          b1_origem?: string | null
          b1_pafmd5?: string | null
          b1_parcei?: string | null
          b1_pautfet?: number | null
          b1_pcofins?: number | null
          b1_pcsll?: number | null
          b1_pe?: number | null
          b1_pergart?: number | null
          b1_perinv?: number | null
          b1_pesbru?: number | null
          b1_peso?: number | null
          b1_picm?: number | null
          b1_picment?: number | null
          b1_picmret?: number | null
          b1_pis?: string | null
          b1_pmacnut?: number | null
          b1_pmicnut?: number | null
          b1_porcprl?: string | null
          b1_posipi?: string | null
          b1_potenci?: number | null
          b1_ppis?: number | null
          b1_pr43080?: number | null
          b1_prdori?: string | null
          b1_prfdsul?: number | null
          b1_princmg?: number | null
          b1_prn944i?: string | null
          b1_proc?: string | null
          b1_prodpai?: string | null
          b1_prodrec?: string | null
          b1_prodsbp?: string | null
          b1_prv1?: number | null
          b1_prvalid?: number | null
          b1_qb?: number | null
          b1_qbp?: number | null
          b1_qe?: number | null
          b1_qtdacum?: number | null
          b1_qtdinic?: number | null
          b1_qtdser?: string | null
          b1_qtmidia?: number | null
          b1_quadpro?: string | null
          b1_rastro?: string | null
          b1_redcof?: number | null
          b1_redinss?: number | null
          b1_redirrf?: number | null
          b1_redpis?: number | null
          b1_refbas?: string | null
          b1_regesim?: string | null
          b1_regriss?: string | null
          b1_regseq?: string | null
          b1_requis?: string | null
          b1_retoper?: string | null
          b1_revatu?: string | null
          b1_ricm65?: string | null
          b1_rprodep?: string | null
          b1_rsativo?: string | null
          b1_segum?: string | null
          b1_selo?: string | null
          b1_seloen?: string | null
          b1_serie?: string | null
          b1_setor?: string | null
          b1_sitprod?: string | null
          b1_sittrib?: string | null
          b1_solicit?: string | null
          b1_tab_ipi?: string | null
          b1_talla?: string | null
          b1_te?: string | null
          b1_tecla?: string | null
          b1_terum?: string | null
          b1_tfethab?: string | null
          b1_tipcar?: string | null
          b1_tipconv?: string | null
          b1_tipe?: string | null
          b1_tipo?: string | null
          b1_tipobn?: string | null
          b1_tipocq?: string | null
          b1_tipodec?: string | null
          b1_tipvec?: string | null
          b1_titorig?: string | null
          b1_tnatrec?: string | null
          b1_toler?: number | null
          b1_tpdp?: string | null
          b1_tpprod?: string | null
          b1_tpreg?: string | null
          b1_tribmun?: string | null
          b1_ts?: string | null
          b1_ucalstd?: string | null
          b1_ucom?: string | null
          b1_um?: string | null
          b1_umoec?: number | null
          b1_uprc?: number | null
          b1_urev?: string | null
          b1_usafefo?: string | null
          b1_userlga?: string | null
          b1_userlgi?: string | null
          b1_uvlrc?: number | null
          b1_valepre?: string | null
          b1_verean?: string | null
          b1_vigenc?: string | null
          b1_vlcif?: number | null
          b1_vlr_cof?: number | null
          b1_vlr_icm?: number | null
          b1_vlr_ipi?: number | null
          b1_vlr_pis?: number | null
          b1_vlrefus?: number | null
          b1_vlrselo?: number | null
          b1_zzclass?: string | null
          b1_zzdeses?: string | null
          b1_zzdesin?: string | null
          b1_zzgrau?: string | null
          b1_zzgrctb?: string | null
          b1_zzlote?: string | null
          b1_zzmen1?: string | null
          b1_zzmens?: string | null
          b1_zzperig?: string | null
          created_at?: string
          d_e_l_e_t?: string | null
          id?: string
          is_new_record?: boolean
          last_sync_id?: string | null
          last_synced_at?: string | null
          pending_deletion?: boolean
          pending_deletion_at?: string | null
          previous_record_hash?: string | null
          protheus_id?: string | null
          r_e_c_d_e_l?: number | null
          r_e_c_n_o?: number | null
          record_hash?: string | null
          updated_at?: string
          was_updated_last_sync?: boolean
        }
        Relationships: []
      }
      protheus_sds010_f444bb4c: {
        Row: {
          created_at: string
          d_e_l_e_t: string | null
          ds_arquivo: string | null
          ds_baseicm: number | null
          ds_chavenf: string | null
          ds_chvnfor: string | null
          ds_clalot: string | null
          ds_cnpj: string | null
          ds_codnfe: string | null
          ds_cond: string | null
          ds_dataimp: string | null
          ds_datapre: string | null
          ds_descont: number | null
          ds_despesa: number | null
          ds_doc: string | null
          ds_doclog: string | null
          ds_emissa: string | null
          ds_especi: string | null
          ds_especi1: string | null
          ds_especi2: string | null
          ds_especi3: string | null
          ds_especi4: string | null
          ds_est: string | null
          ds_filial: string | null
          ds_formul: string | null
          ds_fornec: string | null
          ds_frete: number | null
          ds_horaimp: string | null
          ds_horapre: string | null
          ds_hornfe: string | null
          ds_loja: string | null
          ds_modal: string | null
          ds_mudestr: string | null
          ds_muoritr: string | null
          ds_naturez: string | null
          ds_nfeletr: string | null
          ds_numrps: string | null
          ds_ok: string | null
          ds_pbruto: number | null
          ds_placa: string | null
          ds_pliqui: number | null
          ds_sdoc: string | null
          ds_seguro: number | null
          ds_sereltr: string | null
          ds_serie: string | null
          ds_status: string | null
          ds_tipo: string | null
          ds_total: number | null
          ds_tpcte: string | null
          ds_tpfrete: string | null
          ds_transp: string | null
          ds_ufdestr: string | null
          ds_uforitr: string | null
          ds_userimp: string | null
          ds_userpre: string | null
          ds_valicm: number | null
          ds_valmerc: number | null
          ds_valpedg: number | null
          ds_versao: string | null
          ds_volume1: number | null
          ds_volume2: number | null
          ds_volume3: number | null
          ds_volume4: number | null
          id: string
          is_new_record: boolean
          last_sync_id: string | null
          last_synced_at: string | null
          pending_deletion: boolean
          pending_deletion_at: string | null
          previous_record_hash: string | null
          protheus_id: string | null
          r_e_c_d_e_l: number | null
          r_e_c_n_o: number | null
          record_hash: string | null
          updated_at: string
          was_updated_last_sync: boolean
        }
        Insert: {
          created_at?: string
          d_e_l_e_t?: string | null
          ds_arquivo?: string | null
          ds_baseicm?: number | null
          ds_chavenf?: string | null
          ds_chvnfor?: string | null
          ds_clalot?: string | null
          ds_cnpj?: string | null
          ds_codnfe?: string | null
          ds_cond?: string | null
          ds_dataimp?: string | null
          ds_datapre?: string | null
          ds_descont?: number | null
          ds_despesa?: number | null
          ds_doc?: string | null
          ds_doclog?: string | null
          ds_emissa?: string | null
          ds_especi?: string | null
          ds_especi1?: string | null
          ds_especi2?: string | null
          ds_especi3?: string | null
          ds_especi4?: string | null
          ds_est?: string | null
          ds_filial?: string | null
          ds_formul?: string | null
          ds_fornec?: string | null
          ds_frete?: number | null
          ds_horaimp?: string | null
          ds_horapre?: string | null
          ds_hornfe?: string | null
          ds_loja?: string | null
          ds_modal?: string | null
          ds_mudestr?: string | null
          ds_muoritr?: string | null
          ds_naturez?: string | null
          ds_nfeletr?: string | null
          ds_numrps?: string | null
          ds_ok?: string | null
          ds_pbruto?: number | null
          ds_placa?: string | null
          ds_pliqui?: number | null
          ds_sdoc?: string | null
          ds_seguro?: number | null
          ds_sereltr?: string | null
          ds_serie?: string | null
          ds_status?: string | null
          ds_tipo?: string | null
          ds_total?: number | null
          ds_tpcte?: string | null
          ds_tpfrete?: string | null
          ds_transp?: string | null
          ds_ufdestr?: string | null
          ds_uforitr?: string | null
          ds_userimp?: string | null
          ds_userpre?: string | null
          ds_valicm?: number | null
          ds_valmerc?: number | null
          ds_valpedg?: number | null
          ds_versao?: string | null
          ds_volume1?: number | null
          ds_volume2?: number | null
          ds_volume3?: number | null
          ds_volume4?: number | null
          id?: string
          is_new_record?: boolean
          last_sync_id?: string | null
          last_synced_at?: string | null
          pending_deletion?: boolean
          pending_deletion_at?: string | null
          previous_record_hash?: string | null
          protheus_id?: string | null
          r_e_c_d_e_l?: number | null
          r_e_c_n_o?: number | null
          record_hash?: string | null
          updated_at?: string
          was_updated_last_sync?: boolean
        }
        Update: {
          created_at?: string
          d_e_l_e_t?: string | null
          ds_arquivo?: string | null
          ds_baseicm?: number | null
          ds_chavenf?: string | null
          ds_chvnfor?: string | null
          ds_clalot?: string | null
          ds_cnpj?: string | null
          ds_codnfe?: string | null
          ds_cond?: string | null
          ds_dataimp?: string | null
          ds_datapre?: string | null
          ds_descont?: number | null
          ds_despesa?: number | null
          ds_doc?: string | null
          ds_doclog?: string | null
          ds_emissa?: string | null
          ds_especi?: string | null
          ds_especi1?: string | null
          ds_especi2?: string | null
          ds_especi3?: string | null
          ds_especi4?: string | null
          ds_est?: string | null
          ds_filial?: string | null
          ds_formul?: string | null
          ds_fornec?: string | null
          ds_frete?: number | null
          ds_horaimp?: string | null
          ds_horapre?: string | null
          ds_hornfe?: string | null
          ds_loja?: string | null
          ds_modal?: string | null
          ds_mudestr?: string | null
          ds_muoritr?: string | null
          ds_naturez?: string | null
          ds_nfeletr?: string | null
          ds_numrps?: string | null
          ds_ok?: string | null
          ds_pbruto?: number | null
          ds_placa?: string | null
          ds_pliqui?: number | null
          ds_sdoc?: string | null
          ds_seguro?: number | null
          ds_sereltr?: string | null
          ds_serie?: string | null
          ds_status?: string | null
          ds_tipo?: string | null
          ds_total?: number | null
          ds_tpcte?: string | null
          ds_tpfrete?: string | null
          ds_transp?: string | null
          ds_ufdestr?: string | null
          ds_uforitr?: string | null
          ds_userimp?: string | null
          ds_userpre?: string | null
          ds_valicm?: number | null
          ds_valmerc?: number | null
          ds_valpedg?: number | null
          ds_versao?: string | null
          ds_volume1?: number | null
          ds_volume2?: number | null
          ds_volume3?: number | null
          ds_volume4?: number | null
          id?: string
          is_new_record?: boolean
          last_sync_id?: string | null
          last_synced_at?: string | null
          pending_deletion?: boolean
          pending_deletion_at?: string | null
          previous_record_hash?: string | null
          protheus_id?: string | null
          r_e_c_d_e_l?: number | null
          r_e_c_n_o?: number | null
          record_hash?: string | null
          updated_at?: string
          was_updated_last_sync?: boolean
        }
        Relationships: []
      }
      protheus_supplier_groups: {
        Row: {
          ai_suggested_name: string | null
          cod: string
          created_at: string
          data: Json
          filial: string
          group_key: string | null
          id: string
          name: string | null
          name_source: string
          protheus_table_id: string
          unit_count: number
          updated_at: string
        }
        Insert: {
          ai_suggested_name?: string | null
          cod: string
          created_at?: string
          data?: Json
          filial: string
          group_key?: string | null
          id?: string
          name?: string | null
          name_source?: string
          protheus_table_id: string
          unit_count?: number
          updated_at?: string
        }
        Update: {
          ai_suggested_name?: string | null
          cod?: string
          created_at?: string
          data?: Json
          filial?: string
          group_key?: string | null
          id?: string
          name?: string | null
          name_source?: string
          protheus_table_id?: string
          unit_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "protheus_supplier_groups_protheus_table_id_fkey"
            columns: ["protheus_table_id"]
            isOneToOne: false
            referencedRelation: "protheus_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      protheus_supplier_material_types_map: {
        Row: {
          created_at: string
          created_by: string
          group_id: string
          id: string
          material_type: Database["public"]["Enums"]["material_supply_type"]
        }
        Insert: {
          created_at?: string
          created_by: string
          group_id: string
          id?: string
          material_type: Database["public"]["Enums"]["material_supply_type"]
        }
        Update: {
          created_at?: string
          created_by?: string
          group_id?: string
          id?: string
          material_type?: Database["public"]["Enums"]["material_supply_type"]
        }
        Relationships: [
          {
            foreignKeyName: "protheus_supplier_material_types_map_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "protheus_supplier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      protheus_sy1010_3249e97a: {
        Row: {
          created_at: string
          d_e_l_e_t: string | null
          id: string
          is_new_record: boolean
          last_sync_id: string | null
          last_synced_at: string | null
          pending_deletion: boolean
          pending_deletion_at: string | null
          previous_record_hash: string | null
          protheus_id: string | null
          r_e_c_d_e_l: number | null
          r_e_c_n_o: number | null
          record_hash: string | null
          updated_at: string
          was_updated_last_sync: boolean
          y1_accid: string | null
          y1_cod: string | null
          y1_email: string | null
          y1_fax: string | null
          y1_filial: string | null
          y1_graprcp: string | null
          y1_graprov: string | null
          y1_grupcom: string | null
          y1_nome: string | null
          y1_pedido: string | null
          y1_solcom: string | null
          y1_tel: string | null
          y1_user: string | null
        }
        Insert: {
          created_at?: string
          d_e_l_e_t?: string | null
          id?: string
          is_new_record?: boolean
          last_sync_id?: string | null
          last_synced_at?: string | null
          pending_deletion?: boolean
          pending_deletion_at?: string | null
          previous_record_hash?: string | null
          protheus_id?: string | null
          r_e_c_d_e_l?: number | null
          r_e_c_n_o?: number | null
          record_hash?: string | null
          updated_at?: string
          was_updated_last_sync?: boolean
          y1_accid?: string | null
          y1_cod?: string | null
          y1_email?: string | null
          y1_fax?: string | null
          y1_filial?: string | null
          y1_graprcp?: string | null
          y1_graprov?: string | null
          y1_grupcom?: string | null
          y1_nome?: string | null
          y1_pedido?: string | null
          y1_solcom?: string | null
          y1_tel?: string | null
          y1_user?: string | null
        }
        Update: {
          created_at?: string
          d_e_l_e_t?: string | null
          id?: string
          is_new_record?: boolean
          last_sync_id?: string | null
          last_synced_at?: string | null
          pending_deletion?: boolean
          pending_deletion_at?: string | null
          previous_record_hash?: string | null
          protheus_id?: string | null
          r_e_c_d_e_l?: number | null
          r_e_c_n_o?: number | null
          record_hash?: string | null
          updated_at?: string
          was_updated_last_sync?: boolean
          y1_accid?: string | null
          y1_cod?: string | null
          y1_email?: string | null
          y1_fax?: string | null
          y1_filial?: string | null
          y1_graprcp?: string | null
          y1_graprov?: string | null
          y1_grupcom?: string | null
          y1_nome?: string | null
          y1_pedido?: string | null
          y1_solcom?: string | null
          y1_tel?: string | null
          y1_user?: string | null
        }
        Relationships: []
      }
      protheus_sync_deletions: {
        Row: {
          deleted_at: string
          details: Json
          id: string
          protheus_id: string
          protheus_table_id: string
          supabase_table_name: string
          sync_log_id: string | null
        }
        Insert: {
          deleted_at?: string
          details?: Json
          id?: string
          protheus_id: string
          protheus_table_id: string
          supabase_table_name: string
          sync_log_id?: string | null
        }
        Update: {
          deleted_at?: string
          details?: Json
          id?: string
          protheus_id?: string
          protheus_table_id?: string
          supabase_table_name?: string
          sync_log_id?: string | null
        }
        Relationships: []
      }
      protheus_sync_errors: {
        Row: {
          attempt_number: number
          created_at: string
          error_details: Json | null
          error_message: string
          error_type: string
          id: string
          protheus_key_fields: Json
          protheus_table_id: string
          record_data: Json
          resolution_notes: string | null
          resolved_at: string | null
          sync_log_id: string
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          error_details?: Json | null
          error_message: string
          error_type: string
          id?: string
          protheus_key_fields: Json
          protheus_table_id: string
          record_data: Json
          resolution_notes?: string | null
          resolved_at?: string | null
          sync_log_id: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          error_details?: Json | null
          error_message?: string
          error_type?: string
          id?: string
          protheus_key_fields?: Json
          protheus_table_id?: string
          record_data?: Json
          resolution_notes?: string | null
          resolved_at?: string | null
          sync_log_id?: string
        }
        Relationships: []
      }
      protheus_sync_logs: {
        Row: {
          created_at: string
          error_message: string | null
          executed_for_schedule: string | null
          execution_time_ms: number | null
          finished_at: string | null
          id: string
          protheus_table_id: string
          records_created: number | null
          records_deleted: number | null
          records_processed: number | null
          records_updated: number | null
          started_at: string
          status: string
          sync_details: Json | null
          sync_type: string
          total_records: number | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          executed_for_schedule?: string | null
          execution_time_ms?: number | null
          finished_at?: string | null
          id?: string
          protheus_table_id: string
          records_created?: number | null
          records_deleted?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string
          sync_details?: Json | null
          sync_type?: string
          total_records?: number | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          executed_for_schedule?: string | null
          execution_time_ms?: number | null
          finished_at?: string | null
          id?: string
          protheus_table_id?: string
          records_created?: number | null
          records_deleted?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string
          sync_details?: Json | null
          sync_type?: string
          total_records?: number | null
        }
        Relationships: []
      }
      protheus_table_extra_fields: {
        Row: {
          applied_at: string | null
          applied_to_supabase: boolean | null
          compute_expression: string | null
          compute_mode: string
          compute_options: Json
          compute_separator: string | null
          created_at: string
          default_value: string | null
          field_name: string
          field_type: string
          id: string
          is_required: boolean
          protheus_table_id: string
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          applied_to_supabase?: boolean | null
          compute_expression?: string | null
          compute_mode?: string
          compute_options?: Json
          compute_separator?: string | null
          created_at?: string
          default_value?: string | null
          field_name: string
          field_type: string
          id?: string
          is_required?: boolean
          protheus_table_id: string
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          applied_to_supabase?: boolean | null
          compute_expression?: string | null
          compute_mode?: string
          compute_options?: Json
          compute_separator?: string | null
          created_at?: string
          default_value?: string | null
          field_name?: string
          field_type?: string
          id?: string
          is_required?: boolean
          protheus_table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "protheus_table_extra_fields_protheus_table_id_fkey"
            columns: ["protheus_table_id"]
            isOneToOne: false
            referencedRelation: "protheus_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      protheus_table_relationships: {
        Row: {
          created_at: string
          created_by: string
          id: string
          join_fields: Json
          name: string | null
          notes: string | null
          relationship_type: string
          source_table_id: string
          target_table_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          join_fields?: Json
          name?: string | null
          notes?: string | null
          relationship_type: string
          source_table_id: string
          target_table_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          join_fields?: Json
          name?: string | null
          notes?: string | null
          relationship_type?: string
          source_table_id?: string
          target_table_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      protheus_tables: {
        Row: {
          binary_fields_config: Json | null
          create_supabase_table: boolean
          created_at: string
          created_by: string | null
          cron_expression: string | null
          description: string
          detect_deleted_records: boolean
          detect_new_records: boolean
          enable_sha256_hash: boolean
          extra_database_fields: boolean
          fetch_all_fields: boolean
          id: string
          is_active: boolean
          key_fields: string
          last_sync_at: string | null
          linked_outside_protheus: boolean
          log_hash_changes: boolean
          next_due_at: string | null
          query_interval_unit: string
          query_interval_value: number
          selected_fields: string[] | null
          sync_schedule: Json | null
          sync_type: string | null
          table_name: string
          updated_at: string
        }
        Insert: {
          binary_fields_config?: Json | null
          create_supabase_table?: boolean
          created_at?: string
          created_by?: string | null
          cron_expression?: string | null
          description: string
          detect_deleted_records?: boolean
          detect_new_records?: boolean
          enable_sha256_hash?: boolean
          extra_database_fields?: boolean
          fetch_all_fields?: boolean
          id?: string
          is_active?: boolean
          key_fields?: string
          last_sync_at?: string | null
          linked_outside_protheus?: boolean
          log_hash_changes?: boolean
          next_due_at?: string | null
          query_interval_unit?: string
          query_interval_value?: number
          selected_fields?: string[] | null
          sync_schedule?: Json | null
          sync_type?: string | null
          table_name: string
          updated_at?: string
        }
        Update: {
          binary_fields_config?: Json | null
          create_supabase_table?: boolean
          created_at?: string
          created_by?: string | null
          cron_expression?: string | null
          description?: string
          detect_deleted_records?: boolean
          detect_new_records?: boolean
          enable_sha256_hash?: boolean
          extra_database_fields?: boolean
          fetch_all_fields?: boolean
          id?: string
          is_active?: boolean
          key_fields?: string
          last_sync_at?: string | null
          linked_outside_protheus?: boolean
          log_hash_changes?: boolean
          next_due_at?: string | null
          query_interval_unit?: string
          query_interval_value?: number
          selected_fields?: string[] | null
          sync_schedule?: Json | null
          sync_type?: string | null
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      protheus_usage_logs: {
        Row: {
          config_id: string
          created_at: string
          endpoint_used: string
          error_message: string | null
          executed_at: string
          id: string
          ip_address: unknown | null
          request_data: Json
          response_data: Json | null
          response_status: string
          response_time_ms: number | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          config_id: string
          created_at?: string
          endpoint_used: string
          error_message?: string | null
          executed_at?: string
          id?: string
          ip_address?: unknown | null
          request_data?: Json
          response_data?: Json | null
          response_status: string
          response_time_ms?: number | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          config_id?: string
          created_at?: string
          endpoint_used?: string
          error_message?: string | null
          executed_at?: string
          id?: string
          ip_address?: unknown | null
          request_data?: Json
          response_data?: Json | null
          response_status?: string
          response_time_ms?: number | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      purchases_economic_group_material_types: {
        Row: {
          created_at: string
          created_by: string
          group_id: number
          material_type_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          group_id: number
          material_type_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          group_id?: number
          material_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_economic_group_material_types_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "purchases_economic_groups"
            referencedColumns: ["id_grupo"]
          },
          {
            foreignKeyName: "purchases_economic_group_material_types_material_type_id_fkey"
            columns: ["material_type_id"]
            isOneToOne: false
            referencedRelation: "purchases_material_types"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases_economic_group_members: {
        Row: {
          created_at: string
          created_by: string
          group_id: number
          id: string
          unified_supplier_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          group_id: number
          id?: string
          unified_supplier_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          group_id?: number
          id?: string
          unified_supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_economic_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "purchases_economic_groups"
            referencedColumns: ["id_grupo"]
          },
          {
            foreignKeyName: "purchases_economic_group_members_unified_supplier_id_fkey"
            columns: ["unified_supplier_id"]
            isOneToOne: false
            referencedRelation: "purchases_unified_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases_economic_groups: {
        Row: {
          ai_suggested_name: string | null
          assigned_buyer_cod: string | null
          assigned_buyer_filial: string | null
          code: string | null
          created_at: string
          created_by: string
          id: string
          id_grupo: number
          name: string | null
          name_source: string | null
          protheus_cod: string | null
          protheus_filial: string | null
          updated_at: string
        }
        Insert: {
          ai_suggested_name?: string | null
          assigned_buyer_cod?: string | null
          assigned_buyer_filial?: string | null
          code?: string | null
          created_at?: string
          created_by: string
          id?: string
          id_grupo?: number
          name?: string | null
          name_source?: string | null
          protheus_cod?: string | null
          protheus_filial?: string | null
          updated_at?: string
        }
        Update: {
          ai_suggested_name?: string | null
          assigned_buyer_cod?: string | null
          assigned_buyer_filial?: string | null
          code?: string | null
          created_at?: string
          created_by?: string
          id?: string
          id_grupo?: number
          name?: string | null
          name_source?: string | null
          protheus_cod?: string | null
          protheus_filial?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchases_material_type_buyer_queue: {
        Row: {
          buyer_code: string
          buyer_filial: string
          created_at: string
          created_by: string | null
          id: string
          material_type_id: string
          order_index: number
          updated_at: string
        }
        Insert: {
          buyer_code: string
          buyer_filial: string
          created_at?: string
          created_by?: string | null
          id?: string
          material_type_id: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          buyer_code?: string
          buyer_filial?: string
          created_at?: string
          created_by?: string | null
          id?: string
          material_type_id?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_material_type_buyer_queue_material_type_id_fkey"
            columns: ["material_type_id"]
            isOneToOne: false
            referencedRelation: "purchases_material_types"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases_material_types: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          designated_buyer_code: string | null
          designated_buyer_filial: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          designated_buyer_code?: string | null
          designated_buyer_filial?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          designated_buyer_code?: string | null
          designated_buyer_filial?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchases_potential_supplier_material_types: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          material_type_id: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          material_type_id: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          material_type_id?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_potential_supplier_material_typ_material_type_id_fkey"
            columns: ["material_type_id"]
            isOneToOne: false
            referencedRelation: "purchases_material_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_potential_supplier_material_types_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "purchases_potential_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases_potential_supplier_tags: {
        Row: {
          created_at: string
          created_by: string
          supplier_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          supplier_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          supplier_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_potential_supplier_tags_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "purchases_potential_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_potential_supplier_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "email_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases_potential_suppliers: {
        Row: {
          assigned_buyer_cod: string | null
          assigned_buyer_filial: string | null
          attendance_type: string
          city_id: string | null
          cnpj: string | null
          created_at: string
          created_by: string
          id: string
          legal_name: string | null
          material_types: Database["public"]["Enums"]["material_supply_type"][]
          pf_code: string | null
          pf_number: number
          representative_id: string | null
          source_channel:
            | Database["public"]["Enums"]["supplier_source_channel"]
            | null
          source_detail: string | null
          source_subchannel:
            | Database["public"]["Enums"]["supplier_source_subchannel"]
            | null
          trade_name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          assigned_buyer_cod?: string | null
          assigned_buyer_filial?: string | null
          attendance_type?: string
          city_id?: string | null
          cnpj?: string | null
          created_at?: string
          created_by: string
          id?: string
          legal_name?: string | null
          material_types?: Database["public"]["Enums"]["material_supply_type"][]
          pf_code?: string | null
          pf_number?: number
          representative_id?: string | null
          source_channel?:
            | Database["public"]["Enums"]["supplier_source_channel"]
            | null
          source_detail?: string | null
          source_subchannel?:
            | Database["public"]["Enums"]["supplier_source_subchannel"]
            | null
          trade_name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          assigned_buyer_cod?: string | null
          assigned_buyer_filial?: string | null
          attendance_type?: string
          city_id?: string | null
          cnpj?: string | null
          created_at?: string
          created_by?: string
          id?: string
          legal_name?: string | null
          material_types?: Database["public"]["Enums"]["material_supply_type"][]
          pf_code?: string | null
          pf_number?: number
          representative_id?: string | null
          source_channel?:
            | Database["public"]["Enums"]["supplier_source_channel"]
            | null
          source_detail?: string | null
          source_subchannel?:
            | Database["public"]["Enums"]["supplier_source_subchannel"]
            | null
          trade_name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_potential_suppliers_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "site_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_potential_suppliers_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "commercial_representatives"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases_supplier_group_material_types: {
        Row: {
          created_at: string
          created_by: string
          group_id: string
          id: string
          material_type_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          group_id: string
          id?: string
          material_type_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          group_id?: string
          id?: string
          material_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_group_material_types_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "protheus_supplier_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_group_material_types_material_type_id_fkey"
            columns: ["material_type_id"]
            isOneToOne: false
            referencedRelation: "purchases_material_types"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases_unified_supplier_material_types: {
        Row: {
          created_at: string
          created_by: string
          material_type_id: string
          supplier_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          material_type_id: string
          supplier_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          material_type_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_unified_supplier_material_types_material_type_id_fkey"
            columns: ["material_type_id"]
            isOneToOne: false
            referencedRelation: "purchases_material_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_unified_supplier_material_types_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "purchases_unified_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases_unified_supplier_tags: {
        Row: {
          created_at: string
          created_by: string
          supplier_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          supplier_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          supplier_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_unified_supplier_tags_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "purchases_unified_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_unified_supplier_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "email_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases_unified_suppliers: {
        Row: {
          assigned_buyer_cod: string | null
          assigned_buyer_filial: string | null
          attendance_type: string
          cnpj: string | null
          created_at: string
          created_by: string | null
          economic_group_id: string | null
          fu_id: string
          has_economic_group: boolean
          id: string
          potential_supplier_id: string | null
          protheus_cod: string | null
          protheus_filial: string | null
          protheus_loja: string | null
          representative_id: string | null
          status: Database["public"]["Enums"]["unified_supplier_status"]
          updated_at: string
        }
        Insert: {
          assigned_buyer_cod?: string | null
          assigned_buyer_filial?: string | null
          attendance_type?: string
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          economic_group_id?: string | null
          fu_id?: string
          has_economic_group?: boolean
          id?: string
          potential_supplier_id?: string | null
          protheus_cod?: string | null
          protheus_filial?: string | null
          protheus_loja?: string | null
          representative_id?: string | null
          status?: Database["public"]["Enums"]["unified_supplier_status"]
          updated_at?: string
        }
        Update: {
          assigned_buyer_cod?: string | null
          assigned_buyer_filial?: string | null
          attendance_type?: string
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          economic_group_id?: string | null
          fu_id?: string
          has_economic_group?: boolean
          id?: string
          potential_supplier_id?: string | null
          protheus_cod?: string | null
          protheus_filial?: string | null
          protheus_loja?: string | null
          representative_id?: string | null
          status?: Database["public"]["Enums"]["unified_supplier_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_unified_suppliers_economic_group_id_fkey"
            columns: ["economic_group_id"]
            isOneToOne: false
            referencedRelation: "protheus_supplier_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_unified_suppliers_potential_supplier_id_fkey"
            columns: ["potential_supplier_id"]
            isOneToOne: false
            referencedRelation: "purchases_potential_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_unified_suppliers_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "commercial_representatives"
            referencedColumns: ["id"]
          },
        ]
      }
      record_shares: {
        Row: {
          created_at: string
          expires_at: string | null
          expiry_condition: Json | null
          id: string
          permissions: string[]
          record_id: string
          record_name: string
          record_type: string
          shared_at: string
          shared_by: string
          shared_with: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          expiry_condition?: Json | null
          id?: string
          permissions?: string[]
          record_id: string
          record_name: string
          record_type: string
          shared_at?: string
          shared_by: string
          shared_with: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          expiry_condition?: Json | null
          id?: string
          permissions?: string[]
          record_id?: string
          record_name?: string
          record_type?: string
          shared_at?: string
          shared_by?: string
          shared_with?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_lead_tags: {
        Row: {
          created_at: string
          created_by: string
          id: string
          lead_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          lead_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          lead_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_lead_tags_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_lead_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "email_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_leads: {
        Row: {
          assigned_vendor_cod: string | null
          assigned_vendor_filial: string | null
          attendance_type: string | null
          city_id: string | null
          cnpj: string | null
          created_at: string
          created_by: string
          economic_group_id: number | null
          id: string
          lead_code: string | null
          lead_number: number
          legal_name: string | null
          referral_name: string | null
          representative_id: string | null
          segment_id: string
          source_channel:
            | Database["public"]["Enums"]["lead_source_channel"]
            | null
          source_subchannel: string | null
          trade_name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          assigned_vendor_cod?: string | null
          assigned_vendor_filial?: string | null
          attendance_type?: string | null
          city_id?: string | null
          cnpj?: string | null
          created_at?: string
          created_by: string
          economic_group_id?: number | null
          id?: string
          lead_code?: string | null
          lead_number?: number
          legal_name?: string | null
          referral_name?: string | null
          representative_id?: string | null
          segment_id: string
          source_channel?:
            | Database["public"]["Enums"]["lead_source_channel"]
            | null
          source_subchannel?: string | null
          trade_name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          assigned_vendor_cod?: string | null
          assigned_vendor_filial?: string | null
          attendance_type?: string | null
          city_id?: string | null
          cnpj?: string | null
          created_at?: string
          created_by?: string
          economic_group_id?: number | null
          id?: string
          lead_code?: string | null
          lead_number?: number
          legal_name?: string | null
          referral_name?: string | null
          representative_id?: string | null
          segment_id?: string
          source_channel?:
            | Database["public"]["Enums"]["lead_source_channel"]
            | null
          source_subchannel?: string | null
          trade_name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_leads_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "site_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_leads_economic_group_id_fkey"
            columns: ["economic_group_id"]
            isOneToOne: false
            referencedRelation: "protheus_customer_groups"
            referencedColumns: ["id_grupo"]
          },
          {
            foreignKeyName: "sales_leads_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "commercial_representatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_leads_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "site_product_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_vendor_user_links: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          updated_at: string
          user_id: string
          vendor_cod: string
          vendor_filial: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          updated_at?: string
          user_id: string
          vendor_cod: string
          vendor_filial?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          vendor_cod?: string
          vendor_filial?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_vendor_user_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_cities: {
        Row: {
          average_truck_travel_time_hours: number | null
          capital: number
          cod_munic: string | null
          cod_uf: string | null
          codigo_ibge: string | null
          country: string
          created_at: string
          created_by: string | null
          ddd: string | null
          distance_km_to_indaiatuba: number | null
          distance_last_updated_at: string | null
          distance_source: string | null
          fuso_horario: string | null
          g_formatted_address: string | null
          g_place_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          population_est: number | null
          route_status: string | null
          route_unavailable: boolean | null
          siafi_id: string | null
          time_last_updated_at: string | null
          uf: string
          updated_at: string
        }
        Insert: {
          average_truck_travel_time_hours?: number | null
          capital?: number
          cod_munic?: string | null
          cod_uf?: string | null
          codigo_ibge?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          ddd?: string | null
          distance_km_to_indaiatuba?: number | null
          distance_last_updated_at?: string | null
          distance_source?: string | null
          fuso_horario?: string | null
          g_formatted_address?: string | null
          g_place_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          population_est?: number | null
          route_status?: string | null
          route_unavailable?: boolean | null
          siafi_id?: string | null
          time_last_updated_at?: string | null
          uf: string
          updated_at?: string
        }
        Update: {
          average_truck_travel_time_hours?: number | null
          capital?: number
          cod_munic?: string | null
          cod_uf?: string | null
          codigo_ibge?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          ddd?: string | null
          distance_km_to_indaiatuba?: number | null
          distance_last_updated_at?: string | null
          distance_source?: string | null
          fuso_horario?: string | null
          g_formatted_address?: string | null
          g_place_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          population_est?: number | null
          route_status?: string | null
          route_unavailable?: boolean | null
          siafi_id?: string | null
          time_last_updated_at?: string | null
          uf?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_city_distance_errors: {
        Row: {
          city_id: string
          created_at: string | null
          id: string
          job_id: string
          payload: Json | null
          reason: string
        }
        Insert: {
          city_id: string
          created_at?: string | null
          id?: string
          job_id: string
          payload?: Json | null
          reason: string
        }
        Update: {
          city_id?: string
          created_at?: string | null
          id?: string
          job_id?: string
          payload?: Json | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_city_distance_errors_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "site_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_city_distance_errors_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "site_city_distance_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      site_city_distance_jobs: {
        Row: {
          created_at: string | null
          created_by: string
          error_message: string | null
          failed_cities: number
          finished_at: string | null
          geocoded_cities: number | null
          geocoding_finished_at: string | null
          geocoding_started_at: string | null
          id: string
          last_offset: number | null
          mode: string
          only_fill_empty: boolean
          phase: string | null
          processed_cities: number
          started_at: string | null
          status: string
          total_cities: number
        }
        Insert: {
          created_at?: string | null
          created_by: string
          error_message?: string | null
          failed_cities?: number
          finished_at?: string | null
          geocoded_cities?: number | null
          geocoding_finished_at?: string | null
          geocoding_started_at?: string | null
          id?: string
          last_offset?: number | null
          mode?: string
          only_fill_empty?: boolean
          phase?: string | null
          processed_cities?: number
          started_at?: string | null
          status?: string
          total_cities?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string
          error_message?: string | null
          failed_cities?: number
          finished_at?: string | null
          geocoded_cities?: number | null
          geocoding_finished_at?: string | null
          geocoding_started_at?: string | null
          id?: string
          last_offset?: number | null
          mode?: string
          only_fill_empty?: boolean
          phase?: string | null
          processed_cities?: number
          started_at?: string | null
          status?: string
          total_cities?: number
        }
        Relationships: []
      }
      site_documents: {
        Row: {
          content_html: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          locale: string
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          content_html?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          locale?: string
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          content_html?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          locale?: string
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      site_product_applications: {
        Row: {
          color: string | null
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          name_en: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          name_en?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_product_applications_map: {
        Row: {
          application_id: string
          created_at: string
          created_by: string
          id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          created_by: string
          id?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          created_by?: string
          id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_product_applications_map_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "site_product_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_product_applications_map_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "site_products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_product_families: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          name_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          name_en: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_product_groups: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          name_en: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          name_en?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_product_groups_map: {
        Row: {
          created_at: string
          created_by: string
          group_id: string
          id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          group_id: string
          id?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          group_id?: string
          id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_product_groups_map_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "site_product_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      site_product_names: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          name_en: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          name_en?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_product_segments: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          name_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          name_en: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          name_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_product_segments_map: {
        Row: {
          created_at: string
          product_id: string
          segment_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          segment_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_product_segments_map_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "site_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_product_segments_map_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "site_product_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      site_products: {
        Row: {
          cas_note: string | null
          cas_note_en: string | null
          cas_number: string | null
          compound_type: string | null
          compound_type_en: string | null
          created_at: string
          created_by: string
          family_id: string | null
          id: string
          is_active: boolean
          molecular_formula: string | null
          molecular_structure_image_url: string | null
          molecular_weight: number | null
          name: string
          name_en: string | null
          name_id: string | null
          product_format: string | null
          product_image_url: string | null
          updated_at: string
        }
        Insert: {
          cas_note?: string | null
          cas_note_en?: string | null
          cas_number?: string | null
          compound_type?: string | null
          compound_type_en?: string | null
          created_at?: string
          created_by: string
          family_id?: string | null
          id?: string
          is_active?: boolean
          molecular_formula?: string | null
          molecular_structure_image_url?: string | null
          molecular_weight?: number | null
          name: string
          name_en?: string | null
          name_id?: string | null
          product_format?: string | null
          product_image_url?: string | null
          updated_at?: string
        }
        Update: {
          cas_note?: string | null
          cas_note_en?: string | null
          cas_number?: string | null
          compound_type?: string | null
          compound_type_en?: string | null
          created_at?: string
          created_by?: string
          family_id?: string | null
          id?: string
          is_active?: boolean
          molecular_formula?: string | null
          molecular_structure_image_url?: string | null
          molecular_weight?: number | null
          name?: string
          name_en?: string | null
          name_id?: string | null
          product_format?: string | null
          product_image_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_site_products_name_id"
            columns: ["name_id"]
            isOneToOne: false
            referencedRelation: "site_product_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_products_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "site_product_families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_products_name_id_fkey"
            columns: ["name_id"]
            isOneToOne: false
            referencedRelation: "site_product_names"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          task_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          task_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          task_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks_blockers_v"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string | null
          comment: string
          created_at: string
          id: string
          is_internal: boolean
          mentioned_users: string[] | null
          task_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          comment: string
          created_at?: string
          id?: string
          is_internal?: boolean
          mentioned_users?: string[] | null
          task_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          comment?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          mentioned_users?: string[] | null
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks_blockers_v"
            referencedColumns: ["task_id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          dependency_type: string
          depends_on_task_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          dependency_type?: string
          depends_on_task_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          dependency_type?: string
          depends_on_task_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks_blockers_v"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks_blockers_v"
            referencedColumns: ["task_id"]
          },
        ]
      }
      task_draft_uploads: {
        Row: {
          created_at: string | null
          draft_id: string
          filename: string
          id: string
          size_bytes: number
          storage_path: string
        }
        Insert: {
          created_at?: string | null
          draft_id: string
          filename: string
          id?: string
          size_bytes: number
          storage_path: string
        }
        Update: {
          created_at?: string | null
          draft_id?: string
          filename?: string
          id?: string
          size_bytes?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_draft_uploads_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "task_drafts"
            referencedColumns: ["id"]
          },
        ]
      }
      task_drafts: {
        Row: {
          created_at: string | null
          fixed_type: Database["public"]["Enums"]["fixed_task_type"] | null
          form_state: Json
          id: string
          origin: string
          status: string
          template_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          fixed_type?: Database["public"]["Enums"]["fixed_task_type"] | null
          form_state?: Json
          id?: string
          origin: string
          status?: string
          template_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          fixed_type?: Database["public"]["Enums"]["fixed_task_type"] | null
          form_state?: Json
          id?: string
          origin?: string
          status?: string
          template_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_drafts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          task_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks_blockers_v"
            referencedColumns: ["task_id"]
          },
        ]
      }
      task_series: {
        Row: {
          adjust_policy: string
          base_payload: Json
          base_template_id: string | null
          base_template_snapshot: Json
          catch_up_limit: number
          count_limit: number | null
          created_at: string | null
          days_before_due: number
          description: string | null
          dtstart: string
          exdates: string[] | null
          fixed_type: Database["public"]["Enums"]["fixed_task_type"]
          generation_mode: string
          id: string
          lookahead_count: number
          next_run_at: string
          owner_id: string
          rrule: string
          status: string
          timezone: string
          title: string
          until_date: string | null
          updated_at: string | null
        }
        Insert: {
          adjust_policy?: string
          base_payload?: Json
          base_template_id?: string | null
          base_template_snapshot?: Json
          catch_up_limit?: number
          count_limit?: number | null
          created_at?: string | null
          days_before_due?: number
          description?: string | null
          dtstart: string
          exdates?: string[] | null
          fixed_type: Database["public"]["Enums"]["fixed_task_type"]
          generation_mode?: string
          id?: string
          lookahead_count?: number
          next_run_at: string
          owner_id: string
          rrule: string
          status?: string
          timezone?: string
          title: string
          until_date?: string | null
          updated_at?: string | null
        }
        Update: {
          adjust_policy?: string
          base_payload?: Json
          base_template_id?: string | null
          base_template_snapshot?: Json
          catch_up_limit?: number
          count_limit?: number | null
          created_at?: string | null
          days_before_due?: number
          description?: string | null
          dtstart?: string
          exdates?: string[] | null
          fixed_type?: Database["public"]["Enums"]["fixed_task_type"]
          generation_mode?: string
          id?: string
          lookahead_count?: number
          next_run_at?: string
          owner_id?: string
          rrule?: string
          status?: string
          timezone?: string
          title?: string
          until_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_series_base_template_id_fkey"
            columns: ["base_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_series_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          allowed_departments: string[] | null
          allowed_roles: string[] | null
          allowed_users: string[] | null
          confidentiality_level: Database["public"]["Enums"]["confidentiality_level"]
          created_at: string
          created_by: string
          default_assignee_id: string | null
          default_checklist: string[] | null
          default_deadline_offset_hours: number | null
          default_expected_offset_hours: number | null
          default_payload: Json
          default_priority: Database["public"]["Enums"]["task_priority"] | null
          default_sla_hours: number | null
          default_tags: string[]
          department_id: string | null
          description: string | null
          fixed_type: Database["public"]["Enums"]["fixed_task_type"]
          id: string
          is_active: boolean
          name: string
          required_attachments: string[] | null
          updated_at: string
        }
        Insert: {
          allowed_departments?: string[] | null
          allowed_roles?: string[] | null
          allowed_users?: string[] | null
          confidentiality_level?: Database["public"]["Enums"]["confidentiality_level"]
          created_at?: string
          created_by: string
          default_assignee_id?: string | null
          default_checklist?: string[] | null
          default_deadline_offset_hours?: number | null
          default_expected_offset_hours?: number | null
          default_payload?: Json
          default_priority?: Database["public"]["Enums"]["task_priority"] | null
          default_sla_hours?: number | null
          default_tags?: string[]
          department_id?: string | null
          description?: string | null
          fixed_type: Database["public"]["Enums"]["fixed_task_type"]
          id?: string
          is_active?: boolean
          name: string
          required_attachments?: string[] | null
          updated_at?: string
        }
        Update: {
          allowed_departments?: string[] | null
          allowed_roles?: string[] | null
          allowed_users?: string[] | null
          confidentiality_level?: Database["public"]["Enums"]["confidentiality_level"]
          created_at?: string
          created_by?: string
          default_assignee_id?: string | null
          default_checklist?: string[] | null
          default_deadline_offset_hours?: number | null
          default_expected_offset_hours?: number | null
          default_payload?: Json
          default_priority?: Database["public"]["Enums"]["task_priority"] | null
          default_sla_hours?: number | null
          default_tags?: string[]
          department_id?: string | null
          description?: string | null
          fixed_type?: Database["public"]["Enums"]["fixed_task_type"]
          id?: string
          is_active?: boolean
          name?: string
          required_attachments?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      task_types: {
        Row: {
          allowed_departments: string[] | null
          allowed_roles: string[] | null
          allowed_users: string[] | null
          approval_config: Json | null
          confidentiality_level: Database["public"]["Enums"]["confidentiality_level"]
          created_at: string
          created_by: string | null
          description: string | null
          filling_type: Database["public"]["Enums"]["filling_type"]
          form_id: string | null
          goes_to_pending_list: boolean
          icon_color: string
          icon_name: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          allowed_departments?: string[] | null
          allowed_roles?: string[] | null
          allowed_users?: string[] | null
          approval_config?: Json | null
          confidentiality_level?: Database["public"]["Enums"]["confidentiality_level"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          filling_type?: Database["public"]["Enums"]["filling_type"]
          form_id?: string | null
          goes_to_pending_list?: boolean
          icon_color?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          allowed_departments?: string[] | null
          allowed_roles?: string[] | null
          allowed_users?: string[] | null
          approval_config?: Json | null
          confidentiality_level?: Database["public"]["Enums"]["confidentiality_level"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          filling_type?: Database["public"]["Enums"]["filling_type"]
          form_id?: string | null
          goes_to_pending_list?: boolean
          icon_color?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_types_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          approval_description: string | null
          approval_title: string | null
          assigned_department: string | null
          assigned_to: string | null
          assigned_users: string[] | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          deadline_at: string | null
          description: string | null
          due_date: string | null
          estimated_duration_minutes: number | null
          estimated_hours: number | null
          expected_completion_at: string | null
          fixed_type: Database["public"]["Enums"]["fixed_task_type"]
          form_id: string | null
          id: string
          is_workflow_generated: boolean
          occurrence_end: string | null
          occurrence_no: number | null
          occurrence_start: string | null
          parent_task_id: string | null
          payload: Json
          priority: string
          record_id: string | null
          record_type: string | null
          series_id: string | null
          sort_index: number
          status: string
          tags: string[] | null
          task_code: number
          task_type_id: string | null
          template_id: string | null
          template_snapshot: Json | null
          title: string
          updated_at: string
          workflow_id: string | null
          workflow_step_id: string | null
        }
        Insert: {
          actual_hours?: number | null
          approval_description?: string | null
          approval_title?: string | null
          assigned_department?: string | null
          assigned_to?: string | null
          assigned_users?: string[] | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deadline_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_duration_minutes?: number | null
          estimated_hours?: number | null
          expected_completion_at?: string | null
          fixed_type?: Database["public"]["Enums"]["fixed_task_type"]
          form_id?: string | null
          id?: string
          is_workflow_generated?: boolean
          occurrence_end?: string | null
          occurrence_no?: number | null
          occurrence_start?: string | null
          parent_task_id?: string | null
          payload?: Json
          priority?: string
          record_id?: string | null
          record_type?: string | null
          series_id?: string | null
          sort_index?: number
          status?: string
          tags?: string[] | null
          task_code?: number
          task_type_id?: string | null
          template_id?: string | null
          template_snapshot?: Json | null
          title: string
          updated_at?: string
          workflow_id?: string | null
          workflow_step_id?: string | null
        }
        Update: {
          actual_hours?: number | null
          approval_description?: string | null
          approval_title?: string | null
          assigned_department?: string | null
          assigned_to?: string | null
          assigned_users?: string[] | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deadline_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_duration_minutes?: number | null
          estimated_hours?: number | null
          expected_completion_at?: string | null
          fixed_type?: Database["public"]["Enums"]["fixed_task_type"]
          form_id?: string | null
          id?: string
          is_workflow_generated?: boolean
          occurrence_end?: string | null
          occurrence_no?: number | null
          occurrence_start?: string | null
          parent_task_id?: string | null
          payload?: Json
          priority?: string
          record_id?: string | null
          record_type?: string | null
          series_id?: string | null
          sort_index?: number
          status?: string
          tags?: string[] | null
          task_code?: number
          task_type_id?: string | null
          template_id?: string | null
          template_snapshot?: Json | null
          title?: string
          updated_at?: string
          workflow_id?: string | null
          workflow_step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tasks_parent"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tasks_parent"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks_blockers_v"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "tasks_assigned_department_fkey"
            columns: ["assigned_department"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "task_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          device_fp_hash: string | null
          device_name: string
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean
          label: string | null
          last_used_at: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          device_fp_hash?: string | null
          device_name: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          label?: string | null
          last_used_at?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          device_fp_hash?: string | null
          device_name?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          label?: string | null
          last_used_at?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      unified_account_segments_map: {
        Row: {
          account_id: string
          created_at: string
          created_by: string
          id: string
          segment_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          created_by: string
          id?: string
          segment_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          created_by?: string
          id?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_account_segments_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "unified_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_account_segments_segment"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "site_product_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_accounts: {
        Row: {
          created_at: string
          created_by: string | null
          economic_group_id: number | null
          id: string
          lead_id: string | null
          notes: string | null
          protheus_cod: string | null
          protheus_filial: string | null
          protheus_loja: string | null
          representative_id: string | null
          seq_id: number
          service_type: string
          status: Database["public"]["Enums"]["unified_account_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          economic_group_id?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          protheus_cod?: string | null
          protheus_filial?: string | null
          protheus_loja?: string | null
          representative_id?: string | null
          seq_id?: number
          service_type?: string
          status?: Database["public"]["Enums"]["unified_account_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          economic_group_id?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          protheus_cod?: string | null
          protheus_filial?: string | null
          protheus_loja?: string | null
          representative_id?: string | null
          seq_id?: number
          service_type?: string
          status?: Database["public"]["Enums"]["unified_account_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unified_accounts_economic_group_id_fkey"
            columns: ["economic_group_id"]
            isOneToOne: false
            referencedRelation: "protheus_customer_groups"
            referencedColumns: ["id_grupo"]
          },
          {
            foreignKeyName: "unified_accounts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_accounts_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "commercial_representatives"
            referencedColumns: ["id"]
          },
        ]
      }
      user_email_preferences: {
        Row: {
          created_at: string
          email_sync_unit: string
          email_sync_value: number
          id: string
          signature_html: string | null
          signature_updated_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_sync_unit?: string
          email_sync_value?: number
          id?: string
          signature_html?: string | null
          signature_updated_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_sync_unit?: string
          email_sync_value?: number
          id?: string
          signature_html?: string | null
          signature_updated_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          document_id: string
          folder_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          folder_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          folder_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_favorites_document_id"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_favorites_folder_id"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folder_descendant_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_favorites_folder_id"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_id_map: {
        Row: {
          email: string | null
          new_id: string | null
          old_id: string | null
        }
        Insert: {
          email?: string | null
          new_id?: string | null
          old_id?: string | null
        }
        Update: {
          email?: string | null
          new_id?: string | null
          old_id?: string | null
        }
        Relationships: []
      }
      user_notification_configs: {
        Row: {
          channels: Json
          created_at: string | null
          created_by: string
          enabled_statuses: string[]
          id: string
          is_active: boolean
          protheus_table_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channels?: Json
          created_at?: string | null
          created_by: string
          enabled_statuses?: string[]
          id?: string
          is_active?: boolean
          protheus_table_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channels?: Json
          created_at?: string | null
          created_by?: string
          enabled_statuses?: string[]
          id?: string
          is_active?: boolean
          protheus_table_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          department: string
          email: string
          id: string
          last_login: string | null
          name: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department: string
          email: string
          id?: string
          last_login?: string | null
          name: string
          role: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      vendor_user_links: {
        Row: {
          created_at: string
          created_by: string
          id: string
          updated_at: string
          user_id: string
          vendor_code: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          updated_at?: string
          user_id: string
          vendor_code: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          updated_at?: string
          user_id?: string
          vendor_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_user_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_approvals: {
        Row: {
          approval_data: Json | null
          approval_type: Database["public"]["Enums"]["approval_type"] | null
          approved_at: string | null
          approved_by: string | null
          approver_id: string
          auto_shared_record_id: string | null
          comments: string | null
          created_at: string
          expires_at: string | null
          id: string
          original_data: Json | null
          priority: string
          record_reference: Json | null
          requires_record_access: boolean | null
          status: Database["public"]["Enums"]["approval_status"]
          step_id: string
          updated_at: string
          workflow_execution_id: string
        }
        Insert: {
          approval_data?: Json | null
          approval_type?: Database["public"]["Enums"]["approval_type"] | null
          approved_at?: string | null
          approved_by?: string | null
          approver_id: string
          auto_shared_record_id?: string | null
          comments?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          original_data?: Json | null
          priority?: string
          record_reference?: Json | null
          requires_record_access?: boolean | null
          status?: Database["public"]["Enums"]["approval_status"]
          step_id: string
          updated_at?: string
          workflow_execution_id: string
        }
        Update: {
          approval_data?: Json | null
          approval_type?: Database["public"]["Enums"]["approval_type"] | null
          approved_at?: string | null
          approved_by?: string | null
          approver_id?: string
          auto_shared_record_id?: string | null
          comments?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          original_data?: Json | null
          priority?: string
          record_reference?: Json | null
          requires_record_access?: boolean | null
          status?: Database["public"]["Enums"]["approval_status"]
          step_id?: string
          updated_at?: string
          workflow_execution_id?: string
        }
        Relationships: []
      }
      workflow_auto_triggers: {
        Row: {
          created_at: string
          end_date: string | null
          execution_count: number | null
          id: string
          is_active: boolean
          last_triggered_at: string | null
          max_executions: number | null
          next_execution_at: string | null
          trigger_config: Json
          trigger_type: string
          updated_at: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          max_executions?: number | null
          next_execution_at?: string | null
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          max_executions?: number | null
          next_execution_at?: string | null
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_auto_triggers_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_corrections: {
        Row: {
          approval_id: string
          assigned_to: string
          correction_details: string
          created_at: string
          id: string
          requested_by: string
          resolved_at: string | null
          resubmitted_at: string | null
          status: string
          updated_at: string
          workflow_execution_id: string
        }
        Insert: {
          approval_id: string
          assigned_to: string
          correction_details: string
          created_at?: string
          id?: string
          requested_by: string
          resolved_at?: string | null
          resubmitted_at?: string | null
          status?: string
          updated_at?: string
          workflow_execution_id: string
        }
        Update: {
          approval_id?: string
          assigned_to?: string
          correction_details?: string
          created_at?: string
          id?: string
          requested_by?: string
          resolved_at?: string | null
          resubmitted_at?: string | null
          status?: string
          updated_at?: string
          workflow_execution_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_corrections_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_execution_steps: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          execution_id: string
          id: string
          input_data: Json | null
          node_id: string
          output_data: Json | null
          started_at: string | null
          status: string
          step_name: string
          step_type: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_id: string
          id?: string
          input_data?: Json | null
          node_id: string
          output_data?: Json | null
          started_at?: string | null
          status?: string
          step_name: string
          step_type: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_id?: string
          id?: string
          input_data?: Json | null
          node_id?: string
          output_data?: Json | null
          started_at?: string | null
          status?: string
          step_name?: string
          step_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_execution_steps_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "workflow_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          record_id: string | null
          record_type: string | null
          started_at: string
          status: string
          trigger_data: Json | null
          triggered_by: string | null
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          record_id?: string | null
          record_type?: string | null
          started_at?: string
          status?: string
          trigger_data?: Json | null
          triggered_by?: string | null
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          record_id?: string | null
          record_type?: string | null
          started_at?: string
          status?: string
          trigger_data?: Json | null
          triggered_by?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_queue: {
        Row: {
          created_at: string
          error_message: string | null
          execution_id: string | null
          id: string
          max_retries: number
          priority: number
          retry_count: number
          scheduled_at: string
          status: string
          trigger_data: Json | null
          updated_at: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          execution_id?: string | null
          id?: string
          max_retries?: number
          priority?: number
          retry_count?: number
          scheduled_at?: string
          status?: string
          trigger_data?: Json | null
          updated_at?: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          execution_id?: string | null
          id?: string
          max_retries?: number
          priority?: number
          retry_count?: number
          scheduled_at?: string
          status?: string
          trigger_data?: Json | null
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_queue_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "workflow_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_queue_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          category: string
          complexity_level: string
          confidentiality_level: Database["public"]["Enums"]["confidentiality_level"]
          created_at: string
          created_by: string
          department_ids: string[] | null
          description: string | null
          example_usage: string | null
          id: string
          instructions: string | null
          is_active: boolean
          name: string
          prerequisites: string | null
          tags: string[] | null
          updated_at: string
          usage_count: number
          workflow_definition: Json
        }
        Insert: {
          category?: string
          complexity_level?: string
          confidentiality_level?: Database["public"]["Enums"]["confidentiality_level"]
          created_at?: string
          created_by: string
          department_ids?: string[] | null
          description?: string | null
          example_usage?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name: string
          prerequisites?: string | null
          tags?: string[] | null
          updated_at?: string
          usage_count?: number
          workflow_definition?: Json
        }
        Update: {
          category?: string
          complexity_level?: string
          confidentiality_level?: Database["public"]["Enums"]["confidentiality_level"]
          created_at?: string
          created_by?: string
          department_ids?: string[] | null
          description?: string | null
          example_usage?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name?: string
          prerequisites?: string | null
          tags?: string[] | null
          updated_at?: string
          usage_count?: number
          workflow_definition?: Json
        }
        Relationships: []
      }
      workflow_trigger_logs: {
        Row: {
          created_at: string
          execution_id: string | null
          id: string
          status: string
          trigger_data: Json
          trigger_type: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          execution_id?: string | null
          id?: string
          status?: string
          trigger_data?: Json
          trigger_type: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          execution_id?: string | null
          id?: string
          status?: string
          trigger_data?: Json
          trigger_type?: string
          workflow_id?: string
        }
        Relationships: []
      }
      workflows: {
        Row: {
          allowed_departments: string[] | null
          allowed_roles: string[] | null
          allowed_users: string[] | null
          can_be_deleted: boolean | null
          confidentiality_level: Database["public"]["Enums"]["confidentiality_level"]
          created_at: string
          created_by: string | null
          deleted_at: string | null
          department_ids: string[] | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          priority: string
          status: string
          tags: string[] | null
          trigger_conditions: Json | null
          trigger_type: string
          updated_at: string
          workflow_definition: Json
          workflow_type: string
        }
        Insert: {
          allowed_departments?: string[] | null
          allowed_roles?: string[] | null
          allowed_users?: string[] | null
          can_be_deleted?: boolean | null
          confidentiality_level?: Database["public"]["Enums"]["confidentiality_level"]
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          department_ids?: string[] | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          priority?: string
          status?: string
          tags?: string[] | null
          trigger_conditions?: Json | null
          trigger_type?: string
          updated_at?: string
          workflow_definition?: Json
          workflow_type?: string
        }
        Update: {
          allowed_departments?: string[] | null
          allowed_roles?: string[] | null
          allowed_users?: string[] | null
          can_be_deleted?: boolean | null
          confidentiality_level?: Database["public"]["Enums"]["confidentiality_level"]
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          department_ids?: string[] | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          priority?: string
          status?: string
          tags?: string[] | null
          trigger_conditions?: Json | null
          trigger_type?: string
          updated_at?: string
          workflow_definition?: Json
          workflow_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      folder_descendant_counts: {
        Row: {
          doc_count: number | null
          id: string | null
        }
        Relationships: []
      }
      folder_document_counts: {
        Row: {
          doc_count: number | null
          folder_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folder_descendant_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks_blockers_v: {
        Row: {
          blocked_until: string | null
          blocker_ids: string[] | null
          open_blockers: number | null
          task_id: string | null
        }
        Insert: {
          blocked_until?: never
          blocker_ids?: never
          open_blockers?: never
          task_id?: string | null
        }
        Update: {
          blocked_until?: never
          blocker_ids?: never
          open_blockers?: never
          task_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_lead_to_group: {
        Args: { p_id_grupo: number; p_lead_id: string }
        Returns: Json
      }
      add_member_to_group: {
        Args: {
          p_cod: string
          p_filial: string
          p_id_grupo: number
          p_loja: string
          p_table_id: string
        }
        Returns: Json
      }
      add_unified_supplier_to_group: {
        Args: { p_group_id: string; p_unified_id: string }
        Returns: Json
      }
      add_unified_supplier_to_purchases_group: {
        Args: { p_id_grupo: number; p_unified_id: string }
        Returns: Json
      }
      add_unified_to_group: {
        Args: { p_id_grupo: number; p_unified_id: string }
        Returns: Json
      }
      apply_material_types_to_purchases_group_members: {
        Args: { p_id_grupo: number; p_material_type_ids: string[] }
        Returns: Json
      }
      archive_document_version: {
        Args: { p_created_by?: string; p_document_id: string }
        Returns: string
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      calculate_chunk_quality_score: {
        Args: { chunk_text: string }
        Returns: number
      }
      can_access_confidential_file: {
        Args: {
          file_confidentiality: Database["public"]["Enums"]["confidentiality_level"]
          user_id: string
        }
        Returns: boolean
      }
      can_access_form: {
        Args: {
          p_allowed_departments: string[]
          p_allowed_roles: string[]
          p_allowed_users: string[]
          p_confidentiality_level: Database["public"]["Enums"]["confidentiality_level"]
          p_user_id: string
        }
        Returns: boolean
      }
      can_access_form_response: {
        Args: { response_form_id: string }
        Returns: boolean
      }
      can_access_task_template: {
        Args: {
          p_allowed_departments: string[]
          p_allowed_roles: string[]
          p_allowed_users: string[]
          p_confidentiality_level: Database["public"]["Enums"]["confidentiality_level"]
          p_user_id: string
        }
        Returns: boolean
      }
      can_access_task_type: {
        Args: {
          p_allowed_departments: string[]
          p_allowed_roles: string[]
          p_allowed_users: string[]
          p_confidentiality_level: Database["public"]["Enums"]["confidentiality_level"]
          p_user_id: string
        }
        Returns: boolean
      }
      can_access_workflow: {
        Args:
          | {
              user_id: string
              workflow_confidentiality: Database["public"]["Enums"]["confidentiality_level"]
            }
          | {
              user_id: string
              workflow_confidentiality: Database["public"]["Enums"]["confidentiality_level"]
              workflow_id: string
            }
        Returns: boolean
      }
      can_approve_access_request: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_approve_file: {
        Args: { file_id: string; user_id: string }
        Returns: boolean
      }
      can_delete_workflow: {
        Args: { workflow_id_param: string }
        Returns: boolean
      }
      can_modify_user_role: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      can_view_employee_sensitive_data: {
        Args: {
          employee_record: Database["public"]["Tables"]["employees"]["Row"]
        }
        Returns: {
          birth_date: string | null
          contract_type: Database["public"]["Enums"]["contract_type"] | null
          cpf: string
          created_at: string
          department_id: string | null
          email: string | null
          employee_code: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          hire_date: string
          id: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          position: string
          rg: string | null
          salary: number | null
          status: Database["public"]["Enums"]["employee_status"] | null
          supervisor_id: string | null
          termination_date: string | null
          updated_at: string
        }
      }
      check_device_trust_anonymous: {
        Args: { device_fingerprint_param: string }
        Returns: boolean
      }
      check_document_expiry_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_ip_rate_limit: {
        Args: { ip_hash: string }
        Returns: boolean
      }
      check_shared_record_access: {
        Args: { p_record_id: string; p_record_type: string; p_user_id?: string }
        Returns: boolean
      }
      clean_audit_logs: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      clean_message_preview: {
        Args: { message_text: string }
        Returns: string
      }
      cleanup_expired_access_requests: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_password_tokens: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_telegram_codes: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_trusted_devices: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_trusted_devices_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_whatsapp_codes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_access_requests: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_processed_requests: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_task_drafts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_stuck_documents: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      compute_acl_hash: {
        Args: {
          confidentiality_level?: string
          department_id?: string
          folder_id?: string
          user_id?: string
        }
        Returns: string
      }
      compute_document_acl_hash: {
        Args: { doc_id: string }
        Returns: string
      }
      count_potential_without_unified: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      count_protheus_without_unified: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      count_purchases_economic_groups: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      count_unified_suppliers_without_group: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_approval_with_record_access: {
        Args: {
          p_approval_data?: Json
          p_approval_type?: Database["public"]["Enums"]["approval_type"]
          p_approver_id: string
          p_expires_at?: string
          p_priority?: string
          p_record_reference?: Json
          p_requires_record_access?: boolean
          p_step_id: string
          p_workflow_execution_id: string
        }
        Returns: string
      }
      create_customer_group: {
        Args: { p_nome_grupo: string; p_table_id: string }
        Returns: number
      }
      create_dynamic_table: {
        Args: { table_definition: string }
        Returns: Json
      }
      create_economic_group: {
        Args: { p_nome_grupo: string }
        Returns: Json
      }
      create_missing_purchases_groups: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_missing_unified_accounts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_missing_unified_suppliers: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_missing_unified_suppliers_from_protheus: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_purchases_economic_group: {
        Args: { p_name?: string }
        Returns: {
          code: string
          id_grupo: number
          name: string
        }[]
      }
      delete_economic_group: {
        Args: { p_id_grupo: number }
        Returns: Json
      }
      drop_dynamic_table: {
        Args: { p_table_name: string }
        Returns: Json
      }
      enable_table_rls: {
        Args: { table_name: string }
        Returns: Json
      }
      ensure_unified_supplier_and_assign_group: {
        Args: { p_group_id?: number; p_potential_id: string }
        Returns: Json
      }
      ensure_unified_supplier_from_potential: {
        Args: { p_potential_id: string }
        Returns: string
      }
      execute_sql: {
        Args: { sql_statement: string }
        Returns: Json
      }
      fix_chunk_count_inconsistencies: {
        Args: Record<PropertyKey, never>
        Returns: {
          document_id: string
          new_count: number
          old_count: number
        }[]
      }
      generate_approval_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_device_fingerprint: {
        Args: {
          language_param: string
          screen_resolution: string
          timezone_param: string
          user_agent_param: string
        }
        Returns: string
      }
      generate_employee_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_form_publication_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_password_hash: {
        Args: { password: string }
        Returns: string
      }
      generate_password_reset_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_relationship_name: {
        Args: { source_table_name: string; target_table_name: string }
        Returns: string
      }
      generate_secure_form_password: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_secure_password: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_task_occurrences: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_telegram_setup_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_all_purchases_economic_groups: {
        Args: Record<PropertyKey, never>
        Returns: {
          ai_suggested_name: string
          assigned_buyer_cod: string
          assigned_buyer_name: string
          code: string
          created_at: string
          id_grupo: number
          material_types: string[]
          member_count: number
          name: string
        }[]
      }
      get_all_subordinates: {
        Args: { supervisor_uuid: string }
        Returns: {
          subordinate_id: string
        }[]
      }
      get_audit_log_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_audit_log_size: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_customer_groups_with_id: {
        Args: { p_table_id: string }
        Returns: {
          cod: string
          filial: string
          group_id: string
          id_grupo: number
          member_count: number
          nome_grupo: string
          nome_grupo_sugerido: string
          vendor_names: string[]
        }[]
      }
      get_department_name: {
        Args: { dept_id: string }
        Returns: string
      }
      get_group_leads: {
        Args: { p_id_grupo: number }
        Returns: {
          assigned_vendor_cod: string
          city_name: string
          cnpj: string
          lead_id: string
          legal_name: string
          trade_name: string
          vendor_name: string
        }[]
      }
      get_group_members: {
        Args: { p_id_grupo: number; p_table_id: string }
        Returns: {
          cod: string
          filial: string
          loja: string
          nome: string
          nome_reduzido: string
          vendor_name: string
        }[]
      }
      get_last_group_update_results: {
        Args: { p_table_id: string }
        Returns: {
          action: string
          cod: string
          created_at: string
          filial: string
          group_name: string
          loja: string
          nome: string
          reason: string
        }[]
      }
      get_ocr_model_stats: {
        Args: { days_back?: number }
        Returns: {
          avg_processing_time_ms: number
          avg_quality_score: number
          fallback_rate: number
          model: string
          total_cost: number
          total_pages: number
        }[]
      }
      get_protheus_client_groups: {
        Args: { p_table_id: string }
        Returns: {
          a1_cod: string
          a1_filial: string
          display_name: string
          group_id: string
          unit_count: number
          vendors: string[]
        }[]
      }
      get_protheus_group_unit_names: {
        Args: { p_cod: string; p_filial: string; p_table_id: string }
        Returns: {
          loja: string
          short_name: string
          unit_name: string
          vendor: string
        }[]
      }
      get_protheus_supplier_group_unit_names: {
        Args: { p_cod: string; p_filial: string; p_table_id: string }
        Returns: {
          loja: string
          short_name: string
          unit_name: string
        }[]
      }
      get_protheus_supplier_groups: {
        Args: { p_table_id: string }
        Returns: {
          a2_cod: string
          a2_filial: string
          display_name: string
          group_id: string
          unit_count: number
        }[]
      }
      get_purchases_economic_groups: {
        Args: Record<PropertyKey, never>
        Returns: {
          assigned_buyer_cod: string
          assigned_buyer_filial: string
          code: string
          group_assigned_buyer_name: string
          id_grupo: number
          material_type_names: string[]
          member_buyer_names: string[]
          member_count: number
          name: string
          protheus_cod: string
          protheus_filial: string
        }[]
      }
      get_purchases_economic_groups_paginated: {
        Args:
          | {
              p_page?: number
              p_page_size?: number
              p_search_term?: string
              p_sort_column?: string
              p_sort_direction?: string
            }
          | {
              p_page?: number
              p_page_size?: number
              p_search_term?: string
              p_sort_column?: string
              p_sort_direction?: string
            }
        Returns: {
          ai_suggested_name: string
          buyers: string[]
          code: string
          created_at: string
          id_grupo: number
          material_types: string[]
          member_count: number
          name: string
          total_count: number
        }[]
      }
      get_purchases_economic_groups_paginated_v2: {
        Args: {
          p_page?: number
          p_page_size?: number
          p_search_term?: string
          p_sort_column?: string
          p_sort_direction?: string
        }
        Returns: {
          ai_suggested_name: string
          assigned_buyer_cod: string
          assigned_buyer_filial: string
          assigned_buyer_name: string
          code: string
          created_at: string
          group_assigned_buyer_name: string
          id_grupo: number
          material_type_names: string[]
          material_types: string[]
          member_buyer_names: string[]
          member_count: number
          name: string
          protheus_cod: string
          protheus_filial: string
          total_count: number
        }[]
      }
      get_purchases_group_members: {
        Args: { p_id_grupo: number }
        Returns: {
          assigned_buyer_cod: string
          assigned_buyer_filial: string
          assigned_buyer_name: string
          city_label: string
          city_name: string
          city_uf: string
          cnpj: string
          display_name: string
          distance_km_to_indaiatuba: number
          legal_name: string
          protheus_cod: string
          protheus_filial: string
          protheus_loja: string
          trade_name: string
          unified_id: string
          unified_status: string
        }[]
      }
      get_purchases_supplier_totalizers: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_unified_account_names: {
        Args: { p_unified_id: string }
        Returns: {
          legal_name: string
          protheus_cod: string
          protheus_filial: string
          protheus_loja: string
          trade_name: string
        }[]
      }
      get_unified_customer_groups: {
        Args: Record<PropertyKey, never>
        Returns: {
          group_id: string
          group_vendor_name: string
          id_grupo: number
          member_count: number
          nome_grupo: string
          vendor_names: string[]
        }[]
      }
      get_unified_group_members: {
        Args:
          | { p_id_grupo: number }
          | { p_id_grupo: number; p_table_id: string }
        Returns: {
          commercial_name: string
          display_name: string
          legal_name: string
          protheus_cod: string
          protheus_filial: string
          protheus_loja: string
          short_name: string
          unified_id: string
          unified_status: string
          vendor_name: string
        }[]
      }
      get_user_role_and_department: {
        Args: { user_id: string }
        Returns: {
          is_user_leader: boolean
          user_department: string
          user_role: string
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      handle_expired_shares: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      handle_ocr_error: {
        Args: {
          p_document_id: string
          p_error_message: string
          p_should_retry?: boolean
        }
        Returns: Json
      }
      hash_form_token: {
        Args: { token_text: string }
        Returns: string
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_device_trusted: {
        Args: { device_fingerprint_param: string; user_id_param: string }
        Returns: boolean
      }
      is_test_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      list_group_units: {
        Args: { p_table_id: string }
        Returns: {
          assigned_at: string
          cod: string
          filial: string
          group_id: string
          group_name: string
          loja: string
          nome: string
        }[]
      }
      list_missing_unified_suppliers: {
        Args: Record<PropertyKey, never>
        Returns: {
          cnpj: string
          legal_name: string
          potential_id: string
          protheus_cod: string
          protheus_filial: string
          protheus_loja: string
          source: string
          trade_name: string
        }[]
      }
      log_document_access: {
        Args: {
          p_access_type: string
          p_document_id: string
          p_folder_id: string
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: { event_data?: Json; event_type: string }
        Returns: undefined
      }
      matches_protheus_trigger: {
        Args: { event_data: Json; trigger_config: Json }
        Returns: boolean
      }
      merge_all_sa2010_to_unified: {
        Args: { p_table_id: string }
        Returns: Json
      }
      merge_unified_supplier_with_protheus: {
        Args: {
          p_cod: string
          p_filial: string
          p_loja: string
          p_table_id: string
        }
        Returns: Json
      }
      normalize_text: {
        Args: { input_text: string }
        Returns: string
      }
      notify_expiring_shares: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_access_request_approval: {
        Args: {
          approved: boolean
          current_user_id?: string
          edited_data?: Json
          rejection_reason?: string
          request_id: string
          supervisor_id?: string
        }
        Returns: Json
      }
      process_email_approval: {
        Args:
          | { p_action: string; p_token_hash: string }
          | { p_action: string; p_token_hash: string; p_user_id?: string }
        Returns: Json
      }
      process_unified_approval: {
        Args:
          | {
              p_action: Database["public"]["Enums"]["approval_status"]
              p_approval_id: string
              p_comments?: string
            }
          | { p_action: string; p_approval_id: string; p_comments?: string }
        Returns: Json
      }
      process_workflow_triggers: {
        Args: { trigger_data_param: Json; trigger_type_param: string }
        Returns: Json
      }
      query_dynamic_table: {
        Args:
          | {
              column_filters?: Json
              count_only?: boolean
              limit_param?: number
              offset_param?: number
              search_term?: string
              sort_by?: string
              sort_dir?: string
              table_name_param: string
            }
          | {
              column_filters?: Json
              count_only?: boolean
              limit_param?: number
              offset_param?: number
              search_term?: string
              table_name_param: string
            }
          | {
              column_filters?: Json
              limit_param?: number
              offset_param?: number
              order_fields?: string[]
              search_term?: string
              table_name_param: string
            }
          | {
              column_filters?: Json
              limit_param?: number
              offset_param?: number
              search_term?: string
              sort_column?: string
              sort_direction?: string
              table_name_param: string
            }
          | {
              p_columns?: string[]
              p_limit?: number
              p_offset?: number
              p_order_by?: string
              p_table_id: string
              p_where_conditions?: string
            }
        Returns: {
          data: Json
          total_count: number
        }[]
      }
      rebuild_economic_groups_from_unified: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      remove_lead_from_group: {
        Args: { p_id_grupo: number; p_lead_id: string }
        Returns: Json
      }
      remove_member_from_group: {
        Args: {
          p_cod: string
          p_filial: string
          p_id_grupo: number
          p_loja: string
          p_table_id: string
        }
        Returns: Json
      }
      remove_unified_from_group: {
        Args: { p_id_grupo: number; p_unified_id: string }
        Returns: Json
      }
      remove_unified_supplier_from_group: {
        Args: { p_group_id: string; p_unified_id: string }
        Returns: Json
      }
      remove_unified_supplier_from_purchases_group: {
        Args: { p_id_grupo: number; p_unified_id: string }
        Returns: Json
      }
      reset_purchases_economic_groups: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      resolve_form_token: {
        Args: { token_text: string }
        Returns: string
      }
      search_customers_for_groups: {
        Args: { p_search_term: string; p_table_id: string }
        Returns: {
          cod: string
          current_group_id: number
          current_group_name: string
          filial: string
          loja: string
          nome: string
          nome_reduzido: string
          vendor_name: string
        }[]
      }
      search_documents: {
        Args:
          | {
              acl_hash: string
              department_id?: string
              folder_statuses?: string[]
              query_embedding: string
              result_limit?: number
            }
          | {
              acl_hash: string
              include_archived?: boolean
              include_hidden?: boolean
              max_results?: number
              query_embedding: string
            }
        Returns: {
          chunk_index: number
          content: string
          distance: number
          document_id: string
          filename: string
          folder_id: string
          section: string
        }[]
      }
      search_documents_by_type: {
        Args: {
          acl_hash: string
          department_id?: string
          folder_statuses?: string[]
          p_embedding_type: string
          query_embedding: string
          result_limit?: number
        }
        Returns: {
          chunk_index: number
          content: string
          distance: number
          document_id: string
          embedding_type: string
          extraction_source: string
          filename: string
          folder_id: string
          section: string
        }[]
      }
      search_leads_for_groups: {
        Args: { p_search_term: string }
        Returns: {
          assigned_vendor_cod: string
          city_name: string
          cnpj: string
          current_group_id: number
          current_group_name: string
          lead_id: string
          legal_name: string
          trade_name: string
          vendor_name: string
        }[]
      }
      search_purchases_economic_groups: {
        Args: { p_search: string }
        Returns: {
          assigned_buyer_cod: string
          assigned_buyer_filial: string
          code: string
          group_assigned_buyer_name: string
          id_grupo: number
          material_type_names: string[]
          member_buyer_names: string[]
          member_count: number
          name: string
          protheus_cod: string
          protheus_filial: string
        }[]
      }
      search_purchases_unified_suppliers: {
        Args: { p_search_term: string }
        Returns: {
          current_group_id: number
          current_group_name: string
          display_name: string
          protheus_cod: string
          protheus_filial: string
          protheus_loja: string
          unified_id: string
          unified_status: string
        }[]
      }
      search_unified_accounts_for_groups: {
        Args: { p_search_term: string; p_table_id: string }
        Returns: {
          current_group_id: number
          current_group_name: string
          display_name: string
          protheus_cod: string
          protheus_filial: string
          protheus_loja: string
          unified_id: string
          unified_status: string
          vendor_name: string
        }[]
      }
      search_unified_accounts_for_groups_simple: {
        Args: { p_search_term: string }
        Returns: {
          current_group_id: number
          current_group_name: string
          display_name: string
          protheus_cod: string
          protheus_filial: string
          protheus_loja: string
          unified_id: string
          unified_status: string
          vendor_name: string
        }[]
      }
      search_unified_suppliers_for_groups_simple: {
        Args: { p_search_term: string }
        Returns: {
          current_group_id: string
          current_group_name: string
          display_name: string
          protheus_cod: string
          protheus_filial: string
          protheus_loja: string
          unified_id: string
          unified_status: string
        }[]
      }
      set_purchases_group_material_types: {
        Args: { p_group_id: number; p_material_type_ids: string[] }
        Returns: Json
      }
      set_unified_supplier_material_types: {
        Args: { p_material_type_ids: string[]; p_supplier_id: string }
        Returns: Json
      }
      setup_protheus_table_workflow: {
        Args: { table_name_param: string }
        Returns: undefined
      }
      soft_delete_workflow: {
        Args: { workflow_id_param: string }
        Returns: boolean
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      sync_existing_unified_to_potential_material_types: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      sync_purchases_group_material_types_from_members: {
        Args: { p_id_grupo: number }
        Returns: Json
      }
      table_exists: {
        Args: { table_name_param: string }
        Returns: boolean
      }
      trigger_document_expired: {
        Args: { document_id: string }
        Returns: undefined
      }
      trigger_field_change: {
        Args: {
          p_field_name: string
          p_new_value: string
          p_old_value: string
          p_record_id: string
          p_table_name: string
        }
        Returns: undefined
      }
      unaccent: {
        Args: { "": string }
        Returns: string
      }
      unaccent_init: {
        Args: { "": unknown }
        Returns: unknown
      }
      update_cache_access: {
        Args: { p_cache_key: string }
        Returns: undefined
      }
      update_device_last_used: {
        Args: { device_fingerprint_param: string; user_id_param: string }
        Returns: boolean
      }
      update_document_rag_capabilities_manual: {
        Args: { doc_id: string }
        Returns: undefined
      }
      update_document_storage: {
        Args: { doc_id: string; new_mime_type: string; new_storage_key: string }
        Returns: undefined
      }
      update_group_name: {
        Args: {
          p_id_grupo: number
          p_nome_grupo?: string
          p_nome_grupo_sugerido?: string
        }
        Returns: boolean
      }
      update_protheus_customer_groups: {
        Args: { p_table_id: string }
        Returns: Json
      }
      update_purchases_group_details: {
        Args:
          | {
              p_assigned_buyer_cod: string
              p_assigned_buyer_filial: string
              p_id_grupo: number
              p_name: string
            }
          | {
              p_assigned_buyer_cod: string
              p_assigned_buyer_filial: string
              p_id_grupo: number
              p_name: string
              p_protheus_cod: string
              p_protheus_filial: string
            }
        Returns: boolean
      }
      update_purchases_group_name: {
        Args: { p_id_grupo: number; p_name: string }
        Returns: boolean
      }
      user_can_modify_page: {
        Args: { p_page_name: string; p_user_id: string }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      verify_password: {
        Args: { provided_password: string; stored_hash: string }
        Returns: boolean
      }
    }
    Enums: {
      ai_conversation_type: "gestao_documentos" | "geral" | "protheus"
      approval_status:
        | "approved"
        | "pending"
        | "rejected"
        | "needs_correction"
        | "auto_cancelled"
      approval_type:
        | "simple"
        | "access_request"
        | "form_response"
        | "document"
        | "expense"
        | "vacation"
        | "purchase"
      confidentiality_level:
        | "public"
        | "department_leaders"
        | "directors_admins"
        | "private"
      contact_decision_level: "estrategico" | "tatico" | "operacional"
      contact_link_target_kind:
        | "economic_group_sales"
        | "unified_customer"
        | "economic_group_purchases"
        | "unified_supplier"
        | "commercial_rep"
        | "carrier"
        | "external_partner"
        | "public_org"
        | "association_union"
        | "financial_institution"
        | "other_entity"
      contact_link_type: "cliente" | "fornecedor" | "representante" | "entidade"
      contact_treatment: "sr" | "sra" | "direct" | "custom"
      contact_usage_type:
        | "emergencia"
        | "convites_eventos"
        | "beneficios"
        | "comunicacao_institucional"
        | "outro"
      contract_type: "CLT" | "PJ" | "Estagiario" | "Terceirizado" | "Temporario"
      employee_status: "active" | "inactive" | "terminated" | "on_leave"
      family_relationship:
        | "conjuge"
        | "filho_filha"
        | "pai_mae"
        | "amigo"
        | "companheiro"
        | "outro"
      filling_type: "none" | "approval"
      fixed_task_type:
        | "approval"
        | "signature"
        | "form"
        | "review"
        | "simple_task"
        | "call"
        | "email"
        | "meeting"
        | "import_file"
        | "update_file"
        | "document_delivery"
        | "workflow"
      folder_status: "active" | "archived"
      form_publication_status:
        | "draft"
        | "published_internal"
        | "published_external"
        | "published_mixed"
        | "unpublished"
      gender_type: "M" | "F" | "Outros"
      lead_source_channel:
        | "referral"
        | "website"
        | "social"
        | "organic_search"
        | "paid_search"
        | "event"
        | "outbound"
        | "marketplace"
        | "other"
      lgpd_basis:
        | "consentimento"
        | "legitimo_interesse"
        | "cumprimento_obrigacao_legal"
        | "protecao_vida"
        | "exercicio_poder_publico"
        | "interesse_legitimo"
      lgpd_legal_basis:
        | "consentimento"
        | "legitimo_interesse"
        | "obrigacao_legal"
      material_supply_type:
        | "materias_primas"
        | "embalagens"
        | "indiretos"
        | "transportadora"
        | "servicos"
      partner_status: "ativo" | "pausado" | "encerrado" | "avaliando"
      partner_type:
        | "ong"
        | "universidade"
        | "instituto_pesquisa"
        | "camara_comercio"
        | "embaixada"
        | "midia"
        | "evento"
        | "incubadora"
        | "escola_tecnica"
        | "comunidade_oss"
        | "outro"
      permission_level: "ver_modificar" | "ver_somente" | "bloquear_acesso"
      portal_stakeholder: "cliente" | "fornecedor" | "funcionario" | "outro"
      processing_status: "pending" | "processing" | "completed" | "failed"
      project_status: "planejado" | "em_andamento" | "concluido" | "cancelado"
      protheus_record_status: "new" | "updated" | "unchanged" | "deleted"
      relationship_nature:
        | "institucional"
        | "projeto"
        | "patrocinio_nao_comercial"
        | "doacao"
        | "voluntariado"
        | "divulgacao"
        | "mentoria"
        | "outro"
      relevance: "estrategico" | "tatico" | "ocasional"
      risk_level: "baixo" | "medio" | "alto"
      supplier_source_channel:
        | "indicacao_referencia"
        | "pesquisa_propria"
        | "abordagem_proativa"
        | "base_interna"
        | "outros"
      supplier_source_subchannel:
        | "indicacao_cliente"
        | "indicacao_fornecedor_atual"
        | "parceiro_consultor"
        | "funcionario_interno"
        | "outro_contato"
        | "google_internet"
        | "feira_evento"
        | "associacao_sindicato_entidade"
        | "plataforma_b2b_marketplace"
        | "linkedin_rede_profissional"
        | "visita_tecnica_viagem"
        | "contato_direto_fornecedor"
        | "prospeccao_comercial"
        | "banco_dados_historico"
        | "fornecedor_homologado_outra_unidade_grupo"
        | "documentos_tecnicos_projetos_antigos"
        | "origem_nao_especificada"
        | "outro_especificar"
      task_priority: "P1" | "P2" | "P3" | "P4"
      unified_account_status:
        | "lead_only"
        | "customer"
        | "lead_and_customer"
        | "archived"
      unified_supplier_status:
        | "potential_only"
        | "supplier"
        | "potential_and_supplier"
        | "archived"
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
    Enums: {
      ai_conversation_type: ["gestao_documentos", "geral", "protheus"],
      approval_status: [
        "approved",
        "pending",
        "rejected",
        "needs_correction",
        "auto_cancelled",
      ],
      approval_type: [
        "simple",
        "access_request",
        "form_response",
        "document",
        "expense",
        "vacation",
        "purchase",
      ],
      confidentiality_level: [
        "public",
        "department_leaders",
        "directors_admins",
        "private",
      ],
      contact_decision_level: ["estrategico", "tatico", "operacional"],
      contact_link_target_kind: [
        "economic_group_sales",
        "unified_customer",
        "economic_group_purchases",
        "unified_supplier",
        "commercial_rep",
        "carrier",
        "external_partner",
        "public_org",
        "association_union",
        "financial_institution",
        "other_entity",
      ],
      contact_link_type: ["cliente", "fornecedor", "representante", "entidade"],
      contact_treatment: ["sr", "sra", "direct", "custom"],
      contact_usage_type: [
        "emergencia",
        "convites_eventos",
        "beneficios",
        "comunicacao_institucional",
        "outro",
      ],
      contract_type: ["CLT", "PJ", "Estagiario", "Terceirizado", "Temporario"],
      employee_status: ["active", "inactive", "terminated", "on_leave"],
      family_relationship: [
        "conjuge",
        "filho_filha",
        "pai_mae",
        "amigo",
        "companheiro",
        "outro",
      ],
      filling_type: ["none", "approval"],
      fixed_task_type: [
        "approval",
        "signature",
        "form",
        "review",
        "simple_task",
        "call",
        "email",
        "meeting",
        "import_file",
        "update_file",
        "document_delivery",
        "workflow",
      ],
      folder_status: ["active", "archived"],
      form_publication_status: [
        "draft",
        "published_internal",
        "published_external",
        "published_mixed",
        "unpublished",
      ],
      gender_type: ["M", "F", "Outros"],
      lead_source_channel: [
        "referral",
        "website",
        "social",
        "organic_search",
        "paid_search",
        "event",
        "outbound",
        "marketplace",
        "other",
      ],
      lgpd_basis: [
        "consentimento",
        "legitimo_interesse",
        "cumprimento_obrigacao_legal",
        "protecao_vida",
        "exercicio_poder_publico",
        "interesse_legitimo",
      ],
      lgpd_legal_basis: [
        "consentimento",
        "legitimo_interesse",
        "obrigacao_legal",
      ],
      material_supply_type: [
        "materias_primas",
        "embalagens",
        "indiretos",
        "transportadora",
        "servicos",
      ],
      partner_status: ["ativo", "pausado", "encerrado", "avaliando"],
      partner_type: [
        "ong",
        "universidade",
        "instituto_pesquisa",
        "camara_comercio",
        "embaixada",
        "midia",
        "evento",
        "incubadora",
        "escola_tecnica",
        "comunidade_oss",
        "outro",
      ],
      permission_level: ["ver_modificar", "ver_somente", "bloquear_acesso"],
      portal_stakeholder: ["cliente", "fornecedor", "funcionario", "outro"],
      processing_status: ["pending", "processing", "completed", "failed"],
      project_status: ["planejado", "em_andamento", "concluido", "cancelado"],
      protheus_record_status: ["new", "updated", "unchanged", "deleted"],
      relationship_nature: [
        "institucional",
        "projeto",
        "patrocinio_nao_comercial",
        "doacao",
        "voluntariado",
        "divulgacao",
        "mentoria",
        "outro",
      ],
      relevance: ["estrategico", "tatico", "ocasional"],
      risk_level: ["baixo", "medio", "alto"],
      supplier_source_channel: [
        "indicacao_referencia",
        "pesquisa_propria",
        "abordagem_proativa",
        "base_interna",
        "outros",
      ],
      supplier_source_subchannel: [
        "indicacao_cliente",
        "indicacao_fornecedor_atual",
        "parceiro_consultor",
        "funcionario_interno",
        "outro_contato",
        "google_internet",
        "feira_evento",
        "associacao_sindicato_entidade",
        "plataforma_b2b_marketplace",
        "linkedin_rede_profissional",
        "visita_tecnica_viagem",
        "contato_direto_fornecedor",
        "prospeccao_comercial",
        "banco_dados_historico",
        "fornecedor_homologado_outra_unidade_grupo",
        "documentos_tecnicos_projetos_antigos",
        "origem_nao_especificada",
        "outro_especificar",
      ],
      task_priority: ["P1", "P2", "P3", "P4"],
      unified_account_status: [
        "lead_only",
        "customer",
        "lead_and_customer",
        "archived",
      ],
      unified_supplier_status: [
        "potential_only",
        "supplier",
        "potential_and_supplier",
        "archived",
      ],
    },
  },
} as const
