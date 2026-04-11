-- ============================================================
-- CineList Neon Schema (Fresh Start)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS collaborative_list_movies CASCADE;
DROP TABLE IF EXISTS collaborative_list_members CASCADE;
DROP TABLE IF EXISTS collaborative_lists CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS user_movies CASCADE;
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username      TEXT UNIQUE NOT NULL,
    full_name     TEXT,
    avatar_url    TEXT,
    bio           TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE movies (
    tmdb_id       INT PRIMARY KEY,
    title         TEXT NOT NULL,
    poster_path   TEXT,
    backdrop_path TEXT,
    overview      TEXT,
    release_date  DATE,
    vote_average  NUMERIC(3,1),
    genres        TEXT,
    cached_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_movies (
    id          SERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tmdb_id     INT NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
    status      TEXT NOT NULL CHECK (status IN ('watching', 'finished', 'wishlist')),
    rating      INT CHECK (rating >= 0 AND rating <= 10),
    added_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tmdb_id)
);

CREATE TABLE friendships (
    id            SERIAL PRIMARY KEY,
    requester_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    addressee_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(requester_id, addressee_id)
);

CREATE TABLE collaborative_lists (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    created_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collaborative_list_members (
    id        SERIAL PRIMARY KEY,
    list_id   INT NOT NULL REFERENCES collaborative_lists(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role      TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(list_id, user_id)
);

CREATE TABLE collaborative_list_movies (
    id          SERIAL PRIMARY KEY,
    list_id     INT NOT NULL REFERENCES collaborative_lists(id) ON DELETE CASCADE,
    tmdb_id     INT NOT NULL REFERENCES movies(tmdb_id) ON DELETE CASCADE,
    added_by    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    added_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(list_id, tmdb_id)
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_user_movies_user ON user_movies(user_id);
CREATE INDEX idx_user_movies_status ON user_movies(user_id, status);
CREATE INDEX idx_friendships_users ON friendships(requester_id, addressee_id);
CREATE INDEX idx_collab_members_list ON collaborative_list_members(list_id);
CREATE INDEX idx_collab_movies_list ON collaborative_list_movies(list_id);

-- Seed row to validate API connectivity (optional)
-- INSERT INTO profiles (email, password_hash, username, full_name)
-- VALUES ('demo@cinelist.local', 'demo', 'demo', 'Demo User');