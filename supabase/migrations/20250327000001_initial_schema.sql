-- ═══════════════════════════════════════════════════════════════════
--  NOTEFRAIS — Schéma Supabase complet
--  Stack : Supabase (PostgreSQL + Auth + Storage) + Vercel (Next.js)
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
--  EXTENSIONS
-- ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
--  ENUM TYPES
-- ─────────────────────────────────────────────
create type user_role as enum ('employee', 'validator', 'admin');
create type report_status as enum ('draft', 'submitted', 'approved', 'rejected');
create type expense_category as enum ('Transport', 'Repas', 'Hébergement', 'Fournitures', 'Autre');

-- ─────────────────────────────────────────────
--  TABLE : profiles
--  Extension de auth.users (Supabase Auth)
--  Créée automatiquement via trigger à l'inscription
-- ─────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  first_name    text not null,
  last_name     text not null,
  email         text not null unique,
  role          user_role not null default 'employee',
  -- validator_id : le valideur auquel cet employé est rattaché
  validator_id  uuid references public.profiles(id) on delete set null,
  avatar_url    text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'Profils utilisateurs étendant auth.users';
comment on column public.profiles.validator_id is 'Valideur rattaché (null pour les valideurs et admins)';

-- ─────────────────────────────────────────────
--  TABLE : expense_reports
--  Note de frais (en-tête)
-- ─────────────────────────────────────────────
create table public.expense_reports (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  title           text not null,
  period_start    date,
  period_end      date,
  status          report_status not null default 'draft',
  total_ht        numeric(10,2) not null default 0,
  total_tva       numeric(10,2) not null default 0,
  total_ttc       numeric(10,2) not null default 0,
  -- Champs de validation
  reviewed_by     uuid references public.profiles(id) on delete set null,
  reviewed_at     timestamptz,
  review_comment  text,
  submitted_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.expense_reports is 'Notes de frais (en-tête)';

-- ─────────────────────────────────────────────
--  TABLE : expense_lines
--  Lignes de dépenses d'une note de frais
-- ─────────────────────────────────────────────
create table public.expense_lines (
  id              uuid primary key default uuid_generate_v4(),
  report_id       uuid not null references public.expense_reports(id) on delete cascade,
  line_order      smallint not null default 0,
  expense_date    date not null,
  category        expense_category not null,
  amount_ht       numeric(10,2) not null default 0,
  amount_tva      numeric(10,2) not null default 0,
  amount_ttc      numeric(10,2) generated always as (amount_ht + amount_tva) stored,
  comment         text,
  -- Référence vers le fichier dans Supabase Storage
  receipt_path    text,        -- ex: receipts/user-uuid/report-uuid/line-uuid.pdf
  receipt_name    text,        -- nom d'origine du fichier
  receipt_size    integer,     -- taille en octets
  receipt_type    text,        -- 'pdf' | 'img'
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.expense_lines is 'Lignes de dépenses';
comment on column public.expense_lines.receipt_path is 'Chemin dans le bucket Supabase Storage "receipts"';

-- ─────────────────────────────────────────────
--  TABLE : notifications
--  Notifications in-app (soumission, validation, refus)
-- ─────────────────────────────────────────────
create table public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  report_id   uuid references public.expense_reports(id) on delete set null,
  type        text not null,   -- 'submitted' | 'approved' | 'rejected'
  message     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

comment on table public.notifications is 'Notifications in-app';

-- ─────────────────────────────────────────────
--  TABLE : expense_categories_config
--  Paramétrage admin des catégories
-- ─────────────────────────────────────────────
create table public.expense_categories_config (
  id            uuid primary key default uuid_generate_v4(),
  name          expense_category not null unique,
  default_tva   numeric(5,2) not null default 20.00,
  ceiling_ht    numeric(10,2),   -- plafond HT (null = sans plafond)
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

comment on table public.expense_categories_config is 'Configuration des catégories de dépenses';

-- ─────────────────────────────────────────────
--  INDEX de performance
-- ─────────────────────────────────────────────
create index idx_reports_user_id    on public.expense_reports(user_id);
create index idx_reports_status     on public.expense_reports(status);
create index idx_reports_submitted  on public.expense_reports(submitted_at desc) where status = 'submitted';
create index idx_lines_report_id    on public.expense_lines(report_id);
create index idx_notifs_user_unread on public.notifications(user_id) where is_read = false;

-- ─────────────────────────────────────────────
--  TRIGGERS : updated_at automatique
-- ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_reports_updated_at
  before update on public.expense_reports
  for each row execute function public.set_updated_at();

create trigger trg_lines_updated_at
  before update on public.expense_lines
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────
--  TRIGGER : recalcul des totaux sur la note
--  Déclenché à chaque insert/update/delete sur expense_lines
-- ─────────────────────────────────────────────
create or replace function public.recalc_report_totals()
returns trigger language plpgsql as $$
declare
  v_report_id uuid;
begin
  v_report_id := coalesce(new.report_id, old.report_id);
  update public.expense_reports
  set
    total_ht  = (select coalesce(sum(amount_ht),  0) from public.expense_lines where report_id = v_report_id),
    total_tva = (select coalesce(sum(amount_tva), 0) from public.expense_lines where report_id = v_report_id),
    total_ttc = (select coalesce(sum(amount_ttc), 0) from public.expense_lines where report_id = v_report_id)
  where id = v_report_id;
  return coalesce(new, old);
end;
$$;

create trigger trg_recalc_totals
  after insert or update or delete on public.expense_lines
  for each row execute function public.recalc_report_totals();

-- ─────────────────────────────────────────────
--  TRIGGER : création du profil à l'inscription
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', 'Prénom'),
    coalesce(new.raw_user_meta_data->>'last_name',  'Nom'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'employee')
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════

alter table public.profiles                 enable row level security;
alter table public.expense_reports          enable row level security;
alter table public.expense_lines            enable row level security;
alter table public.notifications            enable row level security;
alter table public.expense_categories_config enable row level security;

-- Helper : rôle du user connecté
create or replace function public.current_user_role()
returns user_role language sql security definer stable as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ── PROFILES ──
create policy "Lecture : tous les utilisateurs authentifiés"
  on public.profiles for select
  to authenticated using (true);

create policy "Modification : son propre profil"
  on public.profiles for update
  to authenticated using (auth.uid() = id);

create policy "Admin : gestion complète des profils"
  on public.profiles for all
  to authenticated using (public.current_user_role() = 'admin');

-- ── EXPENSE_REPORTS ──
create policy "Employé : voir ses propres notes"
  on public.expense_reports for select
  to authenticated using (
    user_id = auth.uid()
    or public.current_user_role() in ('validator', 'admin')
  );

create policy "Employé : créer ses notes"
  on public.expense_reports for insert
  to authenticated with check (user_id = auth.uid());

create policy "Employé : modifier ses notes en brouillon"
  on public.expense_reports for update
  to authenticated using (
    (user_id = auth.uid() and status = 'draft')
    or public.current_user_role() in ('validator', 'admin')
  );

create policy "Admin : supprimer une note"
  on public.expense_reports for delete
  to authenticated using (
    (user_id = auth.uid() and status = 'draft')
    or public.current_user_role() = 'admin'
  );

-- ── EXPENSE_LINES ──
create policy "Lecture lignes : propriétaire ou valideur/admin"
  on public.expense_lines for select
  to authenticated using (
    exists (
      select 1 from public.expense_reports r
      where r.id = report_id
      and (r.user_id = auth.uid() or public.current_user_role() in ('validator','admin'))
    )
  );

create policy "Écriture lignes : propriétaire note en brouillon"
  on public.expense_lines for insert
  to authenticated with check (
    exists (
      select 1 from public.expense_reports r
      where r.id = report_id and r.user_id = auth.uid() and r.status = 'draft'
    )
  );

create policy "Modification lignes : propriétaire note en brouillon"
  on public.expense_lines for update
  to authenticated using (
    exists (
      select 1 from public.expense_reports r
      where r.id = report_id and r.user_id = auth.uid() and r.status = 'draft'
    )
  );

create policy "Suppression lignes : propriétaire note en brouillon"
  on public.expense_lines for delete
  to authenticated using (
    exists (
      select 1 from public.expense_reports r
      where r.id = report_id and r.user_id = auth.uid() and r.status = 'draft'
    )
  );

-- ── NOTIFICATIONS ──
create policy "Lecture : ses propres notifications"
  on public.notifications for select
  to authenticated using (user_id = auth.uid());

create policy "Modification : marquer comme lu"
  on public.notifications for update
  to authenticated using (user_id = auth.uid());

-- ── CATEGORIES CONFIG ──
create policy "Lecture : tous"
  on public.expense_categories_config for select
  to authenticated using (true);

create policy "Admin : gestion catégories"
  on public.expense_categories_config for all
  to authenticated using (public.current_user_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════════
--  SUPABASE STORAGE — Bucket "receipts"
-- ═══════════════════════════════════════════════════════════════════
-- À exécuter dans la console Supabase Storage ou via l'API :
--
--   bucket name : receipts
--   public      : false  (accès via URLs signées uniquement)
--   file size   : 5 Mo max
--   MIME types  : application/pdf, image/jpeg, image/png
--
-- Structure des chemins :
--   receipts/{user_id}/{report_id}/{line_id}.{ext}
--
-- Policies Storage (à créer dans Supabase Dashboard > Storage > Policies) :
--
--   SELECT : authenticated users can read their own files
--     ((storage.foldername(name))[1] = auth.uid()::text)
--     OR (current_user_role() IN ('validator','admin'))
--
--   INSERT : authenticated users can upload to their own folder
--     ((storage.foldername(name))[1] = auth.uid()::text)
--
--   DELETE : owner or admin
--     ((storage.foldername(name))[1] = auth.uid()::text)
--     OR (current_user_role() = 'admin')

-- ═══════════════════════════════════════════════════════════════════
--  SEED DATA — Utilisateurs initiaux
-- ═══════════════════════════════════════════════════════════════════
-- Note : les comptes auth.users sont créés via Supabase Auth (invite ou signup).
-- Les profils sont ensuite mis à jour avec les bons rôles ci-dessous.
-- Les UUIDs sont des exemples — remplacez par ceux générés par Supabase Auth.

-- 1. Antoine BARBET — Employé + Administrateur
-- insert into public.profiles (id, first_name, last_name, email, role, is_active)
-- values ('aaaaaaaa-0001-0001-0001-000000000001', 'Antoine', 'BARBET', 'a.barbet@corp.fr', 'admin', true);

-- 2. Amélie NUSSBAUM — Employé + Valideur
-- insert into public.profiles (id, first_name, last_name, email, role, is_active)
-- values ('aaaaaaaa-0002-0002-0002-000000000002', 'Amélie', 'NUSSBAUM', 'a.nussbaum@corp.fr', 'validator', true);

-- 3. Damien DRILLET — Employé + Valideur
-- insert into public.profiles (id, first_name, last_name, email, role, is_active)
-- values ('aaaaaaaa-0003-0003-0003-000000000003', 'Damien', 'DRILLET', 'd.drillet@corp.fr', 'validator', true);

-- 4. Anaïs JOUET — Employé
-- insert into public.profiles (id, first_name, last_name, email, role, is_active, validator_id)
-- values ('aaaaaaaa-0004-0004-0004-000000000004', 'Anaïs', 'JOUET', 'a.jouet@corp.fr', 'employee', true,
--         'aaaaaaaa-0002-0002-0002-000000000002'); -- rattachée à Amélie NUSSBAUM

-- Catégories par défaut
insert into public.expense_categories_config (name, default_tva, ceiling_ht) values
  ('Transport',   20.00, null),
  ('Repas',       10.00, 25.00),
  ('Hébergement', 20.00, 150.00),
  ('Fournitures', 20.00, null),
  ('Autre',       20.00, null);

-- ═══════════════════════════════════════════════════════════════════
--  VIEWS UTILES (optionnelles)
-- ═══════════════════════════════════════════════════════════════════

-- Vue : notes de frais avec infos utilisateur
create or replace view public.v_expense_reports as
select
  r.*,
  p.first_name || ' ' || p.last_name as user_full_name,
  p.email                             as user_email,
  p.role                              as user_role,
  rv.first_name || ' ' || rv.last_name as reviewer_full_name
from public.expense_reports r
join public.profiles p  on p.id = r.user_id
left join public.profiles rv on rv.id = r.reviewed_by;

-- Vue : dashboard KPIs par utilisateur
create or replace view public.v_kpi_by_user as
select
  user_id,
  p.first_name || ' ' || p.last_name as full_name,
  count(*) filter (where status = 'draft')     as nb_draft,
  count(*) filter (where status = 'submitted') as nb_pending,
  count(*) filter (where status = 'approved')  as nb_approved,
  count(*) filter (where status = 'rejected')  as nb_rejected,
  coalesce(sum(total_ttc) filter (where status = 'approved'), 0) as total_approved_ttc,
  coalesce(sum(total_tva) filter (where status = 'approved'), 0) as total_tva_recoverable
from public.expense_reports r
join public.profiles p on p.id = r.user_id
group by r.user_id, p.first_name, p.last_name;

-- ═══════════════════════════════════════════════════════════════════
--  FONCTIONS API (appelées depuis Next.js / Vercel)
-- ═══════════════════════════════════════════════════════════════════

-- Soumettre une note de frais
create or replace function public.submit_report(p_report_id uuid)
returns void language plpgsql security definer as $$
declare
  v_report public.expense_reports;
  v_validator_id uuid;
begin
  select * into v_report from public.expense_reports where id = p_report_id and user_id = auth.uid();
  if not found then raise exception 'Note introuvable ou accès refusé'; end if;
  if v_report.status <> 'draft' then raise exception 'Seules les notes en brouillon peuvent être soumises'; end if;

  update public.expense_reports
  set status = 'submitted', submitted_at = now()
  where id = p_report_id;

  -- Notifier le valideur rattaché
  select validator_id into v_validator_id from public.profiles where id = auth.uid();
  if v_validator_id is not null then
    insert into public.notifications (user_id, report_id, type, message)
    values (v_validator_id, p_report_id, 'submitted',
            'Nouvelle note de frais à valider : ' || v_report.title);
  end if;
end;
$$;

-- Valider une note de frais
create or replace function public.approve_report(p_report_id uuid)
returns void language plpgsql security definer as $$
declare
  v_report public.expense_reports;
begin
  if public.current_user_role() not in ('validator','admin') then
    raise exception 'Droits insuffisants';
  end if;
  select * into v_report from public.expense_reports where id = p_report_id and status = 'submitted';
  if not found then raise exception 'Note introuvable ou déjà traitée'; end if;

  update public.expense_reports
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_report_id;

  insert into public.notifications (user_id, report_id, type, message)
  values (v_report.user_id, p_report_id, 'approved',
          'Votre note "' || v_report.title || '" a été validée.');
end;
$$;

-- Refuser une note de frais
create or replace function public.reject_report(p_report_id uuid, p_comment text)
returns void language plpgsql security definer as $$
declare
  v_report public.expense_reports;
begin
  if public.current_user_role() not in ('validator','admin') then
    raise exception 'Droits insuffisants';
  end if;
  if p_comment is null or trim(p_comment) = '' then
    raise exception 'Un commentaire est obligatoire pour le refus';
  end if;
  select * into v_report from public.expense_reports where id = p_report_id and status = 'submitted';
  if not found then raise exception 'Note introuvable ou déjà traitée'; end if;

  update public.expense_reports
  set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), review_comment = p_comment
  where id = p_report_id;

  insert into public.notifications (user_id, report_id, type, message)
  values (v_report.user_id, p_report_id, 'rejected',
          'Votre note "' || v_report.title || '" a été refusée. Motif : ' || p_comment);
end;
$$;
