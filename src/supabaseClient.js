import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mtxctobgjluwkytrtlha.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10eGN0b2Jnamx1d2t5dHJ0bGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTQzODQsImV4cCI6MjA4MDg3MDM4NH0.XcXAvJjL1hKKEjxJlg1pTN1UHKPa6RzO2BSLbolgLSY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Nom du bucket pour les images
export const BUCKET_NAME = 'photo site osteo'

// Gestionnaire de contenu Supabase
export const ContentManager = {
  TABLE_NAME: 'site_content',
  
  // Sauvegarder tout le contenu
  async saveContent(content) {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .upsert({
          id: 1, // Un seul enregistrement pour tout le site
          content: content,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (error) throw error;
      console.log('Contenu sauvegardé dans Supabase');
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw error;
    }
  },
  
  // Charger le contenu
  async loadContent() {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('content')
        .eq('id', 1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Pas de données, retourner null
          return null;
        }
        throw error;
      }
      
      console.log('Contenu chargé depuis Supabase');
      return data?.content || null;
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      return null;
    }
  }
};
