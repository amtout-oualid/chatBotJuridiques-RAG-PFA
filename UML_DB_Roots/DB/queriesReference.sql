--------------------------------------------------------------------------------
-- FILE: queriesReference.sql
-- PURPOSE: All operational queries from the FastAPI Backend
-- PARAMETERS: You will find all the tables creation quies in the "chatBotJuridiques-RAG/UML_DB/DB/creatTables.sql" file .
--------------------------------------------------------------------------------


--------------------------------------------------------------------------------
-- 1. UTILISATEURS (Clerk Synchronization)
--------------------------------------------------------------------------------

-- UPSERT: Insert new user on first login OR Update user info on Clerk change
INSERT INTO utilisateurs (id, email, nom, prenom, role)
VALUES (:clerk_id, :email, :nom, :prenom, :role)
ON CONFLICT (id) 
DO UPDATE SET 
    email = EXCLUDED.email,
    nom = EXCLUDED.nom,
    prenom = EXCLUDED.prenom;

-- Fetch user role (client/avocat) for permissions routing
SELECT role FROM utilisateurs WHERE id = :clerk_id;


--------------------------------------------------------------------------------
-- 2. PROFILS_AVOCATS (Lawyer Profiles)
--------------------------------------------------------------------------------

-- UPSERT: Create or Update lawyer profile
INSERT INTO profils_avocats (utilisateur_id, specialite, bio, telephone, barreau)
VALUES (:clerk_id, :specialite, :bio, :telephone, :barreau)
ON CONFLICT (utilisateur_id) 
DO UPDATE SET 
    specialite = EXCLUDED.specialite,
    bio = EXCLUDED.bio,
    telephone = EXCLUDED.telephone,
    barreau = EXCLUDED.barreau;

-- Update lawyer availability status (online/offline)
UPDATE profils_avocats SET disponible = :status WHERE utilisateur_id = :clerk_id;

-- Fetch specific lawyer profile by user ID
SELECT * FROM profils_avocats WHERE utilisateur_id = :clerk_id;

-- Search list of all available lawyers filtered by specialty
SELECT u.id, u.nom, u.prenom, p.specialite, p.bio, p.barreau
FROM utilisateurs u
JOIN profils_avocats p ON u.id = p.utilisateur_id
WHERE p.disponible = TRUE 
  AND p.specialite ILIKE :specialty_search;


--------------------------------------------------------------------------------
-- 3. SESSIONS_IA (AI Chat Sessions)
--------------------------------------------------------------------------------

-- Create new AI session (Returns the new UUID for the frontend to route to)
INSERT INTO sessions_ia (utilisateur_id, titre)
VALUES (:clerk_id, :titre)
RETURNING id;

-- Fetch list of all active AI sessions for a specific user (Sidebar history)
SELECT id, titre, epingle, date_modif 
FROM sessions_ia 
WHERE utilisateur_id = :clerk_id AND is_deleted = FALSE
ORDER BY epingle DESC, date_modif DESC;

-- Fetch single AI session metadata
SELECT * FROM sessions_ia WHERE id = :session_id AND is_deleted = FALSE;

-- Update AI session title (Rename chat)
UPDATE sessions_ia SET titre = :new_titre WHERE id = :session_id;

-- Update AI session pin status
UPDATE sessions_ia SET epingle = :pin_status WHERE id = :session_id;

-- Force update AI session last modified date (When a new message is sent)
UPDATE sessions_ia SET id = id WHERE id = :session_id;

-- Soft delete AI session (Move to trash)
UPDATE sessions_ia SET is_deleted = TRUE WHERE id = :session_id;


--------------------------------------------------------------------------------
-- 4. MESSAGES_IA (AI Messages & RAG)
--------------------------------------------------------------------------------

-- Insert new message from User
INSERT INTO messages_ia (session_id, auteur, contenu)
VALUES (:session_id, 'user', :contenu);

-- Insert new message from AI (including RAG JSON sources)
INSERT INTO messages_ia (session_id, auteur, contenu, sources_rag)
VALUES (:session_id, 'ia', :contenu, :json_sources_string::jsonb);

-- Fetch all messages for a specific AI session (Keyset/Offset Pagination)
SELECT id, auteur, contenu, sources_rag, date_creation 
FROM messages_ia 
WHERE session_id = :session_id 
ORDER BY date_creation DESC 
LIMIT :limit OFFSET :offset;


--------------------------------------------------------------------------------
-- 5. MODELES_JURIDIQUE (Legal Templates / LaTeX Skeletons)
--------------------------------------------------------------------------------

-- Fetch list of all active templates (metadata only for the UI Gallery)
SELECT id, nom, description, categorie 
FROM modeles_juridiques 
WHERE actif = TRUE
ORDER BY categorie, nom;

-- Fetch the raw LaTeX skeleton code for a selected template to load in editor
SELECT latex_squelette FROM modeles_juridiques WHERE id = :template_id;


--------------------------------------------------------------------------------
-- 6. DOCUMENTS_GENERES (LaTeX Editor)
--------------------------------------------------------------------------------

-- Create new generated document
INSERT INTO documents_generes (utilisateur_id, modele_id, titre, latex_contenu)
VALUES (:clerk_id, :template_id, :titre, :latex_contenu)
RETURNING id;

-- Fetch list of all active documents for a user (Dashboard view)
SELECT id, titre, statut, date_modif 
FROM documents_generes 
WHERE utilisateur_id = :clerk_id AND is_deleted = FALSE
ORDER BY date_modif DESC;

-- Fetch specific document content to load into the LaTeX editor
SELECT latex_contenu, pdf_url, statut 
FROM documents_generes 
WHERE id = :document_id AND is_deleted = FALSE;

-- Auto-Save: Update document latex content 
UPDATE documents_generes 
SET latex_contenu = :new_content 
WHERE id = :document_id;

-- Update document status (brouillon -> finalise)
UPDATE documents_generes SET statut = :new_status WHERE id = :document_id;

-- Save document PDF URL (after compiling LaTeX to PDF)
UPDATE documents_generes SET pdf_url = :url WHERE id = :document_id;

-- Soft delete document
UPDATE documents_generes SET is_deleted = TRUE WHERE id = :document_id;


--------------------------------------------------------------------------------
-- 7. FICHIERS_UTILISATEURS (User Files Management / RAG Context)
--------------------------------------------------------------------------------

-- Log new uploaded file metadata
INSERT INTO fichiers_utilisateurs (utilisateur_id, nom_fichier, url_stockage, type_mime, taille_octets)
VALUES (:clerk_id, :nom_fichier, :url_stockage, :type_mime, :taille_octets)
RETURNING id;

-- Fetch list of all files uploaded by a user
SELECT id, nom_fichier, indexe_rag, date_creation 
FROM fichiers_utilisateurs 
WHERE utilisateur_id = :clerk_id
ORDER BY date_creation DESC;

-- Mark file as successfully vectorized/indexed in Qdrant
UPDATE fichiers_utilisateurs 
SET indexe_rag = TRUE, qdrant_point_id = :qdrant_uuid 
WHERE id = :file_id;

-- Delete file record from database (User removes their PDF)
DELETE FROM fichiers_utilisateurs WHERE id = :file_id;


--------------------------------------------------------------------------------
-- 8. CONVERSATIONS_DIRECTES (Direct Lawyer-Client Chat)
--------------------------------------------------------------------------------

-- Create new direct conversation linking client and lawyer
INSERT INTO conversations_directes (client_id, avocat_id)
VALUES (:client_id, :avocat_id)
RETURNING id;

-- Fetch list of all active direct conversations for a user (As client or lawyer)
SELECT * FROM conversations_directes 
WHERE (client_id = :user_id OR avocat_id = :user_id) 
  AND statut = 'active'
ORDER BY derniere_activite DESC;

-- Fetch specific direct conversation metadata
SELECT * FROM conversations_directes WHERE id = :conversation_id;

-- Update conversation last activity timestamp (When a message is sent)
UPDATE conversations_directes 
SET derniere_activite = CURRENT_TIMESTAMP 
WHERE id = :conversation_id;

-- Update conversation status (Close/Archive the chat)
UPDATE conversations_directes SET statut = :new_status WHERE id = :conversation_id;


--------------------------------------------------------------------------------
-- 9. MESSAGES_DIRECTS (Direct Messages)
--------------------------------------------------------------------------------

-- Insert new direct message into a conversation
INSERT INTO messages_directs (conversation_id, expediteur_id, contenu)
VALUES (:conversation_id, :expediteur_id, :contenu);

-- Fetch all direct messages for a specific conversation
SELECT * FROM messages_directs 
WHERE conversation_id = :conversation_id 
ORDER BY date_creation ASC;

-- Update direct message read status (Mark as read by the receiver)
UPDATE messages_directs 
SET lu = TRUE 
WHERE conversation_id = :conversation_id 
  AND expediteur_id != :current_user_id;