-- Script SQL pour créer la table de contenu du site dans Supabase
-- À exécuter dans : https://supabase.com/dashboard/project/mtxctobgjluwkytrtlha/editor

-- Créer la table site_content
CREATE TABLE IF NOT EXISTS site_content (
  id INTEGER PRIMARY KEY DEFAULT 1,
  content JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Activer RLS (Row Level Security)
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre la lecture publique
CREATE POLICY "Allow public read access" 
ON site_content FOR SELECT 
TO PUBLIC 
USING (true);

-- Créer une politique pour permettre les insertions/mises à jour publiques
-- ATTENTION: En production, vous devriez restreindre cela aux utilisateurs authentifiés
CREATE POLICY "Allow public insert/update" 
ON site_content FOR ALL
TO PUBLIC 
USING (true)
WITH CHECK (true);

-- Créer un index sur updated_at pour de meilleures performances
CREATE INDEX IF NOT EXISTS idx_site_content_updated_at ON site_content(updated_at);

-- Message de confirmation
SELECT 'Table site_content créée avec succès!' as message;
