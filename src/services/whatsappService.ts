import { supabase } from '@/lib/supabase';

export interface WhatsappGroupLink {
  id: string;
  community_id: string;
  group_name: string;
  invite_link: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CreateWhatsappGroupLinkDTO {
  community_id: string;
  group_name: string;
  invite_link: string;
}

export interface UpdateWhatsappGroupLinkDTO {
  group_name?: string;
  invite_link?: string;
  is_active?: boolean;
}

class WhatsappService {
  async getGroupLinksByCommunity(communityId: string) {
    try {
      console.log(`[whatsappService] Buscando grupos do WhatsApp para a comunidade: ${communityId}`);
      
      // Verificar se o usuário está autenticado
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('[whatsappService] Erro de autenticação:', authError);
        throw new Error('Erro de autenticação ao buscar grupos do WhatsApp');
      }
      
      if (!userData.user) {
        console.error('[whatsappService] Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }
      
      // Verificar se a tabela existe
      try {
        // Consulta para verificar se a tabela existe
        const { error: tableCheckError } = await supabase
          .from('whatsapp_group_links')
          .select('id')
          .limit(1);
          
        if (tableCheckError) {
          console.error('[whatsappService] Erro ao verificar tabela:', tableCheckError);
          if (tableCheckError.message.includes('does not exist')) {
            throw new Error('A tabela de grupos do WhatsApp não existe no banco de dados');
          }
        }
      } catch (tableError) {
        console.error('[whatsappService] Erro ao verificar tabela:', tableError);
        // Continuar mesmo com erro para tentar a consulta principal
      }
      
      // Buscar os links dos grupos
      const { data, error } = await supabase
        .from('whatsapp_group_links')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[whatsappService] Erro ao buscar links de grupos do WhatsApp:', error);
        if (error.code === '42P01') {
          throw new Error('A tabela de grupos do WhatsApp não existe no banco de dados');
        } else if (error.code === '42501') {
          throw new Error('Permissão negada ao acessar grupos do WhatsApp');
        } else {
          throw new Error(`Erro ao buscar grupos do WhatsApp: ${error.message}`);
        }
      }

      console.log(`[whatsappService] Encontrados ${data?.length || 0} grupos para a comunidade ${communityId}`);
      return data || [];
    } catch (error) {
      console.error('[whatsappService] Erro ao buscar links de grupos do WhatsApp:', error);
      throw error;
    }
  }

  async createGroupLink(data: CreateWhatsappGroupLinkDTO) {
    try {
      const { data: newLink, error } = await supabase
        .from('whatsapp_group_links')
        .insert([
          {
            ...data,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar link de grupo do WhatsApp:', error);
        throw error;
      }

      return newLink;
    } catch (error) {
      console.error('Erro ao criar link de grupo do WhatsApp:', error);
      throw error;
    }
  }

  async updateGroupLink(id: string, updates: UpdateWhatsappGroupLinkDTO) {
    try {
      const { data, error } = await supabase
        .from('whatsapp_group_links')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar link de grupo do WhatsApp:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar link de grupo do WhatsApp:', error);
      throw error;
    }
  }

  async deleteGroupLink(id: string) {
    try {
      const { error } = await supabase
        .from('whatsapp_group_links')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir link de grupo do WhatsApp:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao excluir link de grupo do WhatsApp:', error);
      throw error;
    }
  }
}

export const whatsappService = new WhatsappService();