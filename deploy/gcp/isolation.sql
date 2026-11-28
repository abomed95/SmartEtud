-- Isolation d'une application sur une instance Cloud SQL PARTAGÉE.
-- Par défaut, un utilisateur créé avec « gcloud sql users create » est membre de
-- cloudsqlsuperuser : il peut ouvrir les bases des AUTRES applications.
-- À exécuter une fois, connecté en « postgres » :
--   gcloud sql connect <instance> --user=postgres --database=aqoon
-- (à refaire pour chaque nouvelle application : remplacer aqoon / aqoon_app)

ALTER DATABASE aqoon OWNER TO aqoon_app;          -- l'application reste propriétaire de SA base
REVOKE CONNECT ON DATABASE aqoon FROM PUBLIC;     -- personne d'autre ne peut s'y connecter
GRANT  CONNECT ON DATABASE aqoon TO aqoon_app;
REVOKE cloudsqlsuperuser FROM aqoon_app;          -- plus d'accès aux autres bases
