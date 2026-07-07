-- ============================================================
-- Katiwatch / katiwatch - Complete Supabase Schema
-- Run this entire file in Supabase SQL Editor on a fresh project.
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SHARED UTILITY FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CONTENT TABLES
-- ============================================================

-- VJs (Video Jockeys / Translators)
CREATE TABLE IF NOT EXISTS vjs (
  id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Genres
CREATE TABLE IF NOT EXISTS genres (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  tmdb_id     INTEGER UNIQUE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Movies
CREATE TABLE IF NOT EXISTS movies (
  id                           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                        TEXT NOT NULL,
  description                  TEXT,
  release_date                 DATE,
  cover_image_url              TEXT,
  thumbnail_url                TEXT,
  trailer_url                  TEXT,
  video_url                    TEXT,
  videolink_url                TEXT,
  genre_ids                    UUID[]  DEFAULT '{}',
  duration                     INTEGER,
  views                        INTEGER DEFAULT 0,
  published                    BOOLEAN DEFAULT false,
  premium                      BOOLEAN DEFAULT false,
  recommend                    BOOLEAN DEFAULT false,
  popular                      BOOLEAN DEFAULT false,
  latest                       BOOLEAN DEFAULT false,
  remakes                      BOOLEAN DEFAULT false,
  exclusive_from_kilax_movies  BOOLEAN DEFAULT false,
  category                     TEXT,
  vj_id                        UUID REFERENCES vjs(id) ON DELETE SET NULL,
  tmdb_id                      INTEGER UNIQUE,
  created_at                   TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Series
CREATE TABLE IF NOT EXISTS series (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                 TEXT NOT NULL,
  description           TEXT,
  release_date          DATE,
  cover_image_url       TEXT,
  thumbnail_url         TEXT,
  trailer_url           TEXT,
  genre_ids             UUID[]  DEFAULT '{}',
  views                 INTEGER DEFAULT 0,
  published             BOOLEAN DEFAULT false,
  recommend             BOOLEAN DEFAULT false,
  popular               BOOLEAN DEFAULT false,
  latest                BOOLEAN DEFAULT false,
  remakes               BOOLEAN DEFAULT false,
  exclusive_from_kilax  BOOLEAN DEFAULT false,
  category              TEXT,
  vj_id                 UUID REFERENCES vjs(id) ON DELETE SET NULL,
  tmdb_id               INTEGER UNIQUE,
  created_at            TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Seasons
CREATE TABLE IF NOT EXISTS seasons (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_id     UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  "order"       INTEGER NOT NULL,
  published     BOOLEAN DEFAULT false,
  episode_count INTEGER DEFAULT 0,
  overview      TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Episodes
CREATE TABLE IF NOT EXISTS episodes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id      UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  episode_number INTEGER NOT NULL,
  description    TEXT,
  video_url      TEXT,
  videolink_url  TEXT,
  published      BOOLEAN DEFAULT false,
  premium        BOOLEAN DEFAULT false,
  duration       INTEGER,
  thumbnail_url  TEXT,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================
-- USER & AUTH TABLES
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id                        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                      TEXT,
  email                     TEXT,
  avatar_url                TEXT,
  role                      TEXT DEFAULT 'user',
  notifications_enabled     BOOLEAN DEFAULT true,
  favorite_vjs              UUID[]   DEFAULT '{}',
  favorite_genres           UUID[]   DEFAULT '{}',
  favorite_actors           TEXT[]   DEFAULT '{}',
  subscription              TEXT,
  subscription_start_date   TIMESTAMP WITH TIME ZONE,
  subscription_expiry_date  TIMESTAMP WITH TIME ZONE,
  watch_history             JSONB,
  created_at                TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Admins (panel access control)
CREATE TABLE IF NOT EXISTS admins (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================
-- SUBSCRIPTION & PAYMENT TABLES
-- ============================================================

-- Subscription Plans
CREATE TABLE IF NOT EXISTS plans (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  amount              DECIMAL(15, 2) NOT NULL,
  description         TEXT,
  duration            TEXT,
  duration_in_months  INTEGER,
  duration_in_days    INTEGER,
  recommended         BOOLEAN DEFAULT false,
  sort_order          INTEGER DEFAULT 0,
  features            TEXT[]  DEFAULT '{}',
  active              BOOLEAN DEFAULT true,
  allow_downloads     BOOLEAN DEFAULT false,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Subscriptions (payment ledger)
CREATE TABLE IF NOT EXISTS subscriptions (
  id             SERIAL PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan           TEXT NOT NULL,
  payment_method TEXT,
  subscribed_at  TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- MakyPay Transactions
CREATE TABLE IF NOT EXISTS makypay_transactions (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uuid               VARCHAR(255) NOT NULL UNIQUE,
  reference          VARCHAR(255) NOT NULL UNIQUE,
  provider_reference VARCHAR(255),
  amount             DECIMAL(15, 2) NOT NULL,
  currency           VARCHAR(3)  DEFAULT 'UGX',
  phone_number       VARCHAR(20),
  provider           VARCHAR(50) NOT NULL,
  status             VARCHAR(50) NOT NULL,
  description        TEXT,
  redirect_url       TEXT,
  error_message      TEXT,
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at         TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_makypay_transactions_user_id   ON makypay_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_makypay_transactions_uuid      ON makypay_transactions(uuid);
CREATE INDEX IF NOT EXISTS idx_makypay_transactions_reference ON makypay_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_makypay_transactions_status    ON makypay_transactions(status);
CREATE INDEX IF NOT EXISTS idx_makypay_transactions_created_at ON makypay_transactions(created_at DESC);

CREATE TRIGGER trigger_makypay_transactions_updated_at
  BEFORE UPDATE ON makypay_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- YoPayments Transactions (legacy)
CREATE TABLE IF NOT EXISTS yopayments_transactions (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  internal_reference       VARCHAR(255) NOT NULL UNIQUE,
  transaction_reference    VARCHAR(255),
  mno_transaction_reference VARCHAR(255),
  amount                   DECIMAL(15, 2) NOT NULL,
  currency                 VARCHAR(3)  DEFAULT 'UGX',
  phone_number             VARCHAR(20),
  account_provider_code    VARCHAR(50),
  status                   VARCHAR(50) NOT NULL,
  description              TEXT,
  response_data            JSONB,
  webhook_response         JSONB,
  error_message            TEXT,
  created_at               TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at               TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TRIGGER trigger_yopayments_transactions_updated_at
  BEFORE UPDATE ON yopayments_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ANALYTICS TABLES
-- ============================================================

-- View Logs (basic)
CREATE TABLE IF NOT EXISTS view_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  movie_id   UUID REFERENCES movies(id)  ON DELETE CASCADE,
  series_id  UUID REFERENCES series(id)  ON DELETE CASCADE,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CHECK (
    (movie_id IS NOT NULL AND series_id IS NULL) OR
    (movie_id IS NULL AND series_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_view_logs_movie_id   ON view_logs(movie_id);
CREATE INDEX IF NOT EXISTS idx_view_logs_series_id  ON view_logs(series_id);
CREATE INDEX IF NOT EXISTS idx_view_logs_created_at ON view_logs(created_at DESC);

-- View Logs Enhanced (detailed analytics)
CREATE TABLE IF NOT EXISTS view_logs_enhanced (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  movie_id              UUID REFERENCES movies(id)   ON DELETE CASCADE,
  series_id             UUID REFERENCES series(id)   ON DELETE CASCADE,
  episode_id            UUID REFERENCES episodes(id) ON DELETE CASCADE,
  session_id            TEXT,
  ip_address            TEXT,
  user_agent            TEXT,
  country               TEXT,
  city                  TEXT,
  watch_duration        INTEGER  DEFAULT 0,
  completion_percentage DECIMAL(5, 2) DEFAULT 0,
  is_completed          BOOLEAN  DEFAULT false,
  device_type           TEXT,
  platform              TEXT,
  referrer_url          TEXT,
  started_at            TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  last_updated_at       TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at          TIMESTAMP WITH TIME ZONE,
  CHECK (
    (movie_id IS NOT NULL AND series_id IS NULL AND episode_id IS NULL) OR
    (movie_id IS NULL AND series_id IS NOT NULL) OR
    (movie_id IS NULL AND episode_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_view_logs_enhanced_user_id    ON view_logs_enhanced(user_id);
CREATE INDEX IF NOT EXISTS idx_view_logs_enhanced_movie_id   ON view_logs_enhanced(movie_id);
CREATE INDEX IF NOT EXISTS idx_view_logs_enhanced_series_id  ON view_logs_enhanced(series_id);
CREATE INDEX IF NOT EXISTS idx_view_logs_enhanced_episode_id ON view_logs_enhanced(episode_id);
CREATE INDEX IF NOT EXISTS idx_view_logs_enhanced_session_id ON view_logs_enhanced(session_id);
CREATE INDEX IF NOT EXISTS idx_view_logs_enhanced_started_at ON view_logs_enhanced(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_view_logs_enhanced_device_type ON view_logs_enhanced(device_type);
CREATE INDEX IF NOT EXISTS idx_view_logs_enhanced_country    ON view_logs_enhanced(country);
CREATE INDEX IF NOT EXISTS idx_view_logs_enhanced_is_completed ON view_logs_enhanced(is_completed);
CREATE INDEX IF NOT EXISTS idx_view_logs_enhanced_user_content ON view_logs_enhanced(user_id, movie_id, series_id);
CREATE INDEX IF NOT EXISTS idx_view_logs_enhanced_started_movie  ON view_logs_enhanced(started_at, movie_id);
CREATE INDEX IF NOT EXISTS idx_view_logs_enhanced_started_series ON view_logs_enhanced(started_at, series_id);

CREATE OR REPLACE FUNCTION update_view_log_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_view_logs_enhanced_updated_at
  BEFORE UPDATE ON view_logs_enhanced
  FOR EACH ROW EXECUTE FUNCTION update_view_log_timestamp();

-- ============================================================
-- WATCHLISTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS watchlists (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id   TEXT,
  series_id  TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT watchlists_user_movie_unique  UNIQUE (user_id, movie_id),
  CONSTRAINT watchlists_user_series_unique UNIQUE (user_id, series_id),
  CHECK (
    (movie_id IS NOT NULL AND series_id IS NULL) OR
    (movie_id IS NULL AND series_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_watchlists_user_id   ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_movie_id  ON watchlists(movie_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_series_id ON watchlists(series_id);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  image_url  TEXT,
  status     TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP (TRIGGER)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

-- Daily top movies
CREATE OR REPLACE FUNCTION get_daily_top_movies(
  target_date DATE DEFAULT CURRENT_DATE,
  max_limit   INTEGER DEFAULT 10
)
RETURNS TABLE (movie_id UUID, title TEXT, daily_views BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT v.movie_id, m.title, COUNT(*) AS daily_views
  FROM view_logs v
  JOIN movies m ON m.id = v.movie_id
  WHERE DATE(v.created_at) = target_date AND v.movie_id IS NOT NULL
  GROUP BY v.movie_id, m.title
  ORDER BY daily_views DESC
  LIMIT max_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Daily top series
CREATE OR REPLACE FUNCTION get_daily_top_series(
  target_date DATE DEFAULT CURRENT_DATE,
  max_limit   INTEGER DEFAULT 10
)
RETURNS TABLE (series_id UUID, title TEXT, daily_views BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT v.series_id, s.title, COUNT(*) AS daily_views
  FROM view_logs v
  JOIN series s ON s.id = v.series_id
  WHERE DATE(v.created_at) = target_date AND v.series_id IS NOT NULL
  GROUP BY v.series_id, s.title
  ORDER BY daily_views DESC
  LIMIT max_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Top content by date range
CREATE OR REPLACE FUNCTION get_top_content_by_date_range(
  start_date          DATE,
  end_date            DATE,
  filter_content_type TEXT    DEFAULT 'all',
  max_limit           INTEGER DEFAULT 10
)
RETURNS TABLE (
  content_id               UUID,
  content_type             TEXT,
  title                    TEXT,
  total_views              BIGINT,
  unique_viewers           BIGINT,
  total_watch_time         INTEGER,
  avg_completion_percentage DECIMAL
) AS $$
BEGIN
  IF filter_content_type = 'movie' OR filter_content_type = 'all' THEN
    RETURN QUERY
    SELECT
      v.movie_id,
      'movie'::TEXT,
      m.title,
      COUNT(*),
      COUNT(DISTINCT v.user_id),
      SUM(v.watch_duration)::INTEGER,
      AVG(v.completion_percentage)
    FROM view_logs_enhanced v
    JOIN movies m ON m.id = v.movie_id
    WHERE DATE(v.started_at) BETWEEN start_date AND end_date AND v.movie_id IS NOT NULL
    GROUP BY v.movie_id, m.title
    ORDER BY 4 DESC
    LIMIT max_limit;
  END IF;

  IF filter_content_type = 'series' OR filter_content_type = 'all' THEN
    RETURN QUERY
    SELECT
      v.series_id,
      'series'::TEXT,
      s.title,
      COUNT(*),
      COUNT(DISTINCT v.user_id),
      SUM(v.watch_duration)::INTEGER,
      AVG(v.completion_percentage)
    FROM view_logs_enhanced v
    JOIN series s ON s.id = v.series_id
    WHERE DATE(v.started_at) BETWEEN start_date AND end_date AND v.series_id IS NOT NULL
    GROUP BY v.series_id, s.title
    ORDER BY 4 DESC
    LIMIT max_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Device statistics
CREATE OR REPLACE FUNCTION get_device_statistics(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date   DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  device_type        TEXT,
  total_views        BIGINT,
  unique_users       BIGINT,
  avg_watch_duration DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.device_type,
    COUNT(*),
    COUNT(DISTINCT v.user_id),
    AVG(v.watch_duration)
  FROM view_logs_enhanced v
  WHERE DATE(v.started_at) BETWEEN start_date AND end_date
  GROUP BY v.device_type
  ORDER BY 2 DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Geographic statistics
CREATE OR REPLACE FUNCTION get_geographic_statistics(
  start_date DATE    DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date   DATE    DEFAULT CURRENT_DATE,
  max_limit  INTEGER DEFAULT 20
)
RETURNS TABLE (
  country      TEXT,
  total_views  BIGINT,
  unique_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.country,
    COUNT(*),
    COUNT(DISTINCT v.user_id)
  FROM view_logs_enhanced v
  WHERE DATE(v.started_at) BETWEEN start_date AND end_date AND v.country IS NOT NULL
  GROUP BY v.country
  ORDER BY 2 DESC
  LIMIT max_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User engagement metrics
CREATE OR REPLACE FUNCTION get_user_engagement_metrics(target_user_id UUID)
RETURNS TABLE (
  total_views               BIGINT,
  total_watch_time          INTEGER,
  avg_completion_percentage DECIMAL,
  movies_watched            BIGINT,
  series_watched            BIGINT,
  completed_content         BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*),
    SUM(v.watch_duration)::INTEGER,
    AVG(v.completion_percentage),
    COUNT(DISTINCT v.movie_id),
    COUNT(DISTINCT v.series_id),
    COUNT(*) FILTER (WHERE v.is_completed = true)
  FROM view_logs_enhanced v
  WHERE v.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own"  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON profiles FOR UPDATE USING (auth.uid() = id);

-- admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_select_own" ON admins FOR SELECT USING (auth.uid() = user_id);

-- movies
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "movies_public_read"       ON movies FOR SELECT USING (true);
CREATE POLICY "movies_service_role_all"  ON movies FOR ALL USING (true) WITH CHECK (true);

-- series
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "series_public_read"       ON series FOR SELECT USING (true);
CREATE POLICY "series_service_role_all"  ON series FOR ALL USING (true) WITH CHECK (true);

-- seasons
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seasons_public_read"      ON seasons FOR SELECT USING (true);
CREATE POLICY "seasons_service_role_all" ON seasons FOR ALL USING (true) WITH CHECK (true);

-- episodes
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "episodes_public_read"      ON episodes FOR SELECT USING (true);
CREATE POLICY "episodes_service_role_all" ON episodes FOR ALL USING (true) WITH CHECK (true);

-- genres
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "genres_public_read"       ON genres FOR SELECT USING (true);
CREATE POLICY "genres_service_role_all"  ON genres FOR ALL USING (true) WITH CHECK (true);

-- vjs
ALTER TABLE vjs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vjs_public_read"       ON vjs FOR SELECT USING (true);
CREATE POLICY "vjs_service_role_all"  ON vjs FOR ALL USING (true) WITH CHECK (true);

-- plans
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read"       ON plans FOR SELECT USING (true);
CREATE POLICY "plans_service_role_all"  ON plans FOR ALL USING (true) WITH CHECK (true);

-- subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_select_own"    ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_service_insert" ON subscriptions FOR INSERT WITH CHECK (true);

-- makypay_transactions
ALTER TABLE makypay_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "makypay_select_own"    ON makypay_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "makypay_service_insert" ON makypay_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "makypay_service_update" ON makypay_transactions FOR UPDATE USING (true);

-- yopayments_transactions
ALTER TABLE yopayments_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "yopayments_select_own"    ON yopayments_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "yopayments_service_insert" ON yopayments_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "yopayments_service_update" ON yopayments_transactions FOR UPDATE USING (true);

-- view_logs
ALTER TABLE view_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_logs_public_insert"    ON view_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "view_logs_service_role_all" ON view_logs FOR ALL USING (true) WITH CHECK (true);

-- view_logs_enhanced
ALTER TABLE view_logs_enhanced ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_logs_enhanced_public_insert"    ON view_logs_enhanced FOR INSERT WITH CHECK (true);
CREATE POLICY "view_logs_enhanced_select_own"       ON view_logs_enhanced FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "view_logs_enhanced_service_role_all" ON view_logs_enhanced FOR ALL USING (true) WITH CHECK (true);

-- watchlists
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watchlists_select_own" ON watchlists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "watchlists_insert_own" ON watchlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "watchlists_delete_own" ON watchlists FOR DELETE USING (auth.uid() = user_id);

-- notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_public_read"      ON notifications FOR SELECT USING (true);
CREATE POLICY "notifications_service_role_all" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- GRANTS
-- ============================================================
GRANT SELECT, INSERT, DELETE ON watchlists TO authenticated;
GRANT SELECT ON plans         TO anon, authenticated;
GRANT SELECT ON movies        TO anon, authenticated;
GRANT SELECT ON series        TO anon, authenticated;
GRANT SELECT ON seasons       TO anon, authenticated;
GRANT SELECT ON episodes      TO anon, authenticated;
GRANT SELECT ON genres        TO anon, authenticated;
GRANT SELECT ON vjs           TO anon, authenticated;
GRANT SELECT ON notifications TO anon, authenticated;

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE vjs                   IS 'Video Jockeys / Translators who dub content into local languages';
COMMENT ON TABLE genres                IS 'Movie and series genre categories';
COMMENT ON TABLE movies                IS 'Movie catalog with streaming URLs and metadata';
COMMENT ON TABLE series                IS 'Series catalog — parent of seasons/episodes';
COMMENT ON TABLE seasons               IS 'Seasons belonging to a series';
COMMENT ON TABLE episodes              IS 'Individual episodes within a season';
COMMENT ON TABLE profiles              IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE admins                IS 'Admin panel access whitelist';
COMMENT ON TABLE plans                 IS 'Subscription pricing plans managed from admin panel';
COMMENT ON TABLE subscriptions         IS 'Subscription payment ledger';
COMMENT ON TABLE makypay_transactions  IS 'MakyPay mobile money and card payment transactions';
COMMENT ON TABLE yopayments_transactions IS 'YoPayments mobile money transactions (legacy)';
COMMENT ON TABLE view_logs             IS 'Basic view tracking per movie/series';
COMMENT ON TABLE view_logs_enhanced    IS 'Detailed analytics: device, geo, watch duration, completion';
COMMENT ON TABLE watchlists            IS 'Per-user watchlist — movie_id and series_id stored as TEXT to match Reelplexi API IDs';
COMMENT ON TABLE notifications         IS 'Admin push notifications sent via OneSignal';

COMMENT ON COLUMN profiles.watch_history              IS 'JSONB map of content ID → WatchProgress for continue-watching feature';
COMMENT ON COLUMN plans.allow_downloads               IS 'Whether this plan permits offline downloads';
COMMENT ON COLUMN plans.recommended                   IS 'Show Recommended badge on payment page';
COMMENT ON COLUMN plans.sort_order                    IS 'Display order on payment page (lower = first)';
COMMENT ON COLUMN makypay_transactions.uuid           IS 'MakyPay transaction UUID returned from API';
COMMENT ON COLUMN makypay_transactions.reference      IS 'Custom UUID v4 reference for idempotency';
COMMENT ON COLUMN makypay_transactions.provider_reference IS 'MTN/Airtel transaction reference ID';
COMMENT ON COLUMN makypay_transactions.provider       IS 'Payment provider: mtn, airtel, or card payments';
COMMENT ON COLUMN makypay_transactions.status         IS 'Transaction status: processing, completed, failed';
COMMENT ON COLUMN view_logs_enhanced.watch_duration   IS 'Total seconds watched in this session';
COMMENT ON COLUMN view_logs_enhanced.completion_percentage IS 'Percentage of content watched (0–100)';
COMMENT ON COLUMN view_logs_enhanced.device_type      IS 'Device type: mobile, tablet, desktop, tv';
COMMENT ON COLUMN view_logs_enhanced.platform         IS 'Platform: web, ios, android';
