-- Courses
create table courses (
  id text primary key,
  code text not null,
  slug text unique not null,
  title text not null,
  units int not null,
  lecturer text,
  created_at timestamptz default now()
);

-- Resources (Notes, Textbooks, etc)
create table resources (
  id text primary key,
  course_slug text references courses(slug) on delete cascade,
  slug text not null,
  type text not null,
  name text not null,
  size text,
  date date not null,
  md text, -- The LegalMD content
  is_public boolean default false,
  quiz jsonb, -- Store quiz questions as JSON
  unique(course_slug, slug)
);

-- Notices
create table notices (
  slug text primary key,
  tag text not null, -- 'urgent', 'academic', 'event', 'general'
  pinned boolean default false,
  date date not null,
  title text not null,
  body text not null,
  created_at timestamptz default now()
);

-- Polls
create table polls (
  slug text primary key,
  question text not null,
  created_at timestamptz default now()
);

-- Poll Options
create table poll_options (
  id text primary key,
  poll_slug text references polls(slug) on delete cascade,
  label text not null,
  votes int default 0
);

-- Enable Row Level Security (RLS)
alter table courses enable row level security;
alter table resources enable row level security;
alter table notices enable row level security;
alter table polls enable row level security;
alter table poll_options enable row level security;

-- Policies: Allow public read access to everything
create policy "Public read courses" on courses for select using (true);
create policy "Public read resources" on resources for select using (true);
create policy "Public read notices" on notices for select using (true);
create policy "Public read polls" on polls for select using (true);
create policy "Public read poll options" on poll_options for select using (true);
create policy "Public vote update" on poll_options for update using (true);

-- Tasks (Private to users, but we will use localStorage for tasks for now, so no table needed yet)
