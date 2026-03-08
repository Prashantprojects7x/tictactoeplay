
ALTER TABLE public.profiles ADD COLUMN diamond_tokens integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD CONSTRAINT check_diamond_tokens_non_negative CHECK (diamond_tokens >= 0);
