-- Extension pour les fonctionnalités avancées
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log d'initialisation
DO $$
BEGIN
    RAISE NOTICE 'PostgreSQL initialization script executed successfully';
END $$;
