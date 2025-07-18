-- Migration: Estado real de functions e triggers (via MCP)

-- Functions ativas:
-- auth.email() RETURNS text
-- auth.jwt() RETURNS jsonb
-- auth.role() RETURNS text
-- auth.uid() RETURNS uuid
-- public.create_instructor() RETURNS uuid
-- public.create_student() RETURNS uuid
-- public.handle_new_profile_with_instructor() RETURNS trigger
-- public.update_updated_at_column() RETURNS trigger

-- Triggers ativas:
-- Nenhuma trigger ativa encontrada no momento. 