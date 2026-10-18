create type public.app_role as enum ('admin', 'student');
create type public.feedback_status as enum ('pending', 'reviewed', 'resolved');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "Own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "Own profile readable" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Own profile editable" on public.profiles for update to authenticated using (id = auth.uid());

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text,
  email text,
  is_anonymous boolean not null default false,
  topic text not null,
  rating smallint not null check (rating between 1 and 5),
  teaching_rating smallint not null check (teaching_rating between 1 and 5),
  facilities_rating smallint not null check (facilities_rating between 1 and 5),
  support_rating smallint not null check (support_rating between 1 and 5),
  overall_rating smallint not null check (overall_rating between 1 and 5),
  message text not null check (char_length(message) between 10 and 1000),
  status feedback_status not null default 'pending',
  admin_response text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.feedback to authenticated;
grant all on public.feedback to service_role;
alter table public.feedback enable row level security;

create policy "Students insert own feedback" on public.feedback for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and admin_response is null);
create policy "Students read own feedback" on public.feedback for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Admins update feedback" on public.feedback for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete feedback" on public.feedback for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end $$;
create trigger feedback_touch before update on public.feedback for each row execute function public.touch_updated_at();

-- Anonymous feedback never stores identity
create or replace function public.strip_anonymous() returns trigger language plpgsql set search_path = public
as $$ begin if new.is_anonymous then new.name := null; new.email := null; end if; return new; end $$;
create trigger feedback_strip_anon before insert or update on public.feedback for each row execute function public.strip_anonymous();

-- Signup: profile + role. The very first account registered via the admin page becomes admin; everyone else is a student.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);
  if coalesce(new.raw_user_meta_data->>'requested_role', '') = 'admin'
     and not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'student');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter publication supabase_realtime add table public.feedback;
alter table public.feedback replica identity full;