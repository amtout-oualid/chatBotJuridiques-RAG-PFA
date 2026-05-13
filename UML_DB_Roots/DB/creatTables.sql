
CREATE DATABASE IF NOT EXISTS chatbot_juridique;


-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a reusable trigger function to automatically update 'date_modif'
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modif = now();
    RETURN NEW;
END;
$$ language 'plpgsql';



-------------------------------------------------------------------------------------------------------------------
-- Creating Tables
-------------------------------------------------------------------------------------------------------------------

-- 1. UTILISATEURS (Users)
CREATE TABLE utilisateurs (
    id VARCHAR(255) PRIMARY KEY, -- Clerk ID goes here directly
    email VARCHAR(255) UNIQUE NOT NULL,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('client', 'avocat', 'admin')),
    date_creation TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    date_modif TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER update_utilisateurs_modtime BEFORE UPDATE ON utilisateurs FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 2. PROFILS_AVOCATS (Lawyer Profiles)
CREATE TABLE profils_avocats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id VARCHAR(255) UNIQUE NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    specialite VARCHAR(255),
    bio TEXT,
    telephone VARCHAR(50),
    barreau VARCHAR(255),
    disponible BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. SESSIONS_IA (AI Chat Sessions)
CREATE TABLE sessions_ia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id VARCHAR(255) NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    titre VARCHAR(255) DEFAULT 'Nouvelle Discussion',
    epingle BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete optimization
    date_creation TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    date_modif TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER update_sessions_ia_modtime BEFORE UPDATE ON sessions_ia FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 4. MESSAGES_IA (AI Messages)
CREATE TABLE messages_ia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions_ia(id) ON DELETE CASCADE,
    auteur VARCHAR(50) NOT NULL CHECK (auteur IN ('user', 'ia')),
    contenu TEXT NOT NULL,
    sources_rag JSONB, -- Stored as JSONB for fast querying of metadata/references
    date_creation TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. MODELES_JURIDIQUE (Legal Templates)
CREATE TABLE modeles_juridiques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    latex_squelette TEXT NOT NULL,
    categorie VARCHAR(100),
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. DOCUMENTS_GENERES (Generated Documents)
CREATE TABLE documents_generes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id VARCHAR(255) NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    modele_id UUID REFERENCES modeles_juridiques(id) ON DELETE SET NULL,
    titre VARCHAR(255),
    latex_contenu TEXT,
    pdf_url TEXT,
    statut VARCHAR(50) DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'finalise')),
    is_deleted BOOLEAN DEFAULT FALSE,
    date_creation TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    date_modif TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER update_docs_modtime BEFORE UPDATE ON documents_generes FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 7. FICHIERS_UTILISATEURS (Uploaded Files)
CREATE TABLE fichiers_utilisateurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilisateur_id VARCHAR(255) NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    nom_fichier VARCHAR(255) NOT NULL,
    url_stockage TEXT NOT NULL,
    type_mime VARCHAR(100),
    taille_octets BIGINT,
    indexe_rag BOOLEAN DEFAULT FALSE,
    qdrant_point_id UUID, -- Links precisely to the Qdrant vector mapping
    date_creation TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. CONVERSATIONS_DIRECTES
CREATE TABLE conversations_directes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id VARCHAR(255) NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    avocat_id VARCHAR(255) NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    statut VARCHAR(50) DEFAULT 'active' CHECK (statut IN ('active', 'fermee')),
    date_creation TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    derniere_activite TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_conv_client ON conversations_directes(client_id);
CREATE INDEX idx_conv_avocat ON conversations_directes(avocat_id);

-- 9. MESSAGES_DIRECTS
CREATE TABLE messages_directs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations_directes(id) ON DELETE CASCADE,
    expediteur_id VARCHAR(255) NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    contenu TEXT NOT NULL,
    lu BOOLEAN DEFAULT FALSE,
    date_creation TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_msg_direct_conv ON messages_directs(conversation_id);
-------------------------------------------------------------------------------------------------------------------
-- 2. Adding Indexes
-------------------------------------------------------------------------------------------------------------------

-- Foreign Key Indexes (Crucial for JOIN performance)
CREATE INDEX idx_profils_utilisateur ON profils_avocats(utilisateur_id);
CREATE INDEX idx_sessions_utilisateur ON sessions_ia(utilisateur_id);
CREATE INDEX idx_messages_session ON messages_ia(session_id);
CREATE INDEX idx_docs_utilisateur ON documents_generes(utilisateur_id);
CREATE INDEX idx_fichiers_utilisateur ON fichiers_utilisateurs(utilisateur_id);

-- Performance Indexes for frequent queries (Filtering & Sorting)
CREATE INDEX idx_sessions_active ON sessions_ia(utilisateur_id, date_modif DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_messages_date ON messages_ia(session_id, date_creation ASC);
CREATE INDEX idx_docs_status ON documents_generes(utilisateur_id, statut);

-- JSONB Indexing for RAG Sources (Allows you to search inside the JSON fast)
CREATE INDEX idx_messages_sources ON messages_ia USING GIN (sources_rag);

-------------------------------------------------------------------------------------------------------------------
-- 3. Security Policies
-------------------------------------------------------------------------------------------------------------------

-- Enable RLS on sensitive tables
ALTER TABLE sessions_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents_generes ENABLE ROW LEVEL SECURITY;

-- Create policies (Assuming your application sets the current_user_id in a session variable)
-- "Users can only select their own active sessions"
CREATE POLICY select_own_sessions ON sessions_ia
    FOR SELECT
    USING (utilisateur_id = current_setting('app.current_user_id') AND is_deleted = FALSE);

-- "Users can only insert sessions for themselves"
CREATE POLICY insert_own_sessions ON sessions_ia
    FOR INSERT
    WITH CHECK (utilisateur_id = current_setting('app.current_user_id'));


-------------------------------------------------------------------------------------------------------------------
-- 4. VIEW 
-------------------------------------------------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_dashboard_utilisateur AS
SELECT 
    u.id AS utilisateur_id,
    u.nom,
    u.prenom,
    COUNT(DISTINCT s.id) AS total_sessions_ia,
    COUNT(DISTINCT d.id) AS total_documents_generes,
    COUNT(DISTINCT f.id) AS total_fichiers_rag
FROM utilisateurs u
LEFT JOIN sessions_ia s ON u.id = s.utilisateur_id AND s.is_deleted = FALSE
LEFT JOIN documents_generes d ON u.id = d.utilisateur_id AND d.is_deleted = FALSE
LEFT JOIN fichiers_utilisateurs f ON u.id = f.utilisateur_id
GROUP BY u.id, u.nom, u.prenom;

