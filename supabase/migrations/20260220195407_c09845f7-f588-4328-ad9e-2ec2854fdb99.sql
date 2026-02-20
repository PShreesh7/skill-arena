
-- Battle rooms for custom and invite matches
CREATE TABLE public.battle_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 8)),
  name TEXT NOT NULL DEFAULT 'Battle Room',
  creator_id UUID NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed')),
  max_players INTEGER NOT NULL DEFAULT 2,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.battle_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view rooms" ON public.battle_rooms FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create rooms" ON public.battle_rooms FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their rooms" ON public.battle_rooms FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete their rooms" ON public.battle_rooms FOR DELETE USING (auth.uid() = creator_id);

-- Room participants
CREATE TABLE public.room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.battle_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  elo INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view participants" ON public.room_participants FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can join rooms" ON public.room_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON public.room_participants FOR DELETE USING (auth.uid() = user_id);

-- Friend invites
CREATE TABLE public.battle_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  sender_username TEXT NOT NULL,
  receiver_code TEXT NOT NULL,
  room_id UUID REFERENCES public.battle_rooms(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.battle_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their invites" ON public.battle_invites FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can send invites" ON public.battle_invites FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update invites" ON public.battle_invites FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Tournaments
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  creator_id UUID NOT NULL,
  max_players INTEGER NOT NULL DEFAULT 8,
  current_players INTEGER NOT NULL DEFAULT 0,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  prize_xp INTEGER NOT NULL DEFAULT 500,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'in_progress', 'completed')),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view tournaments" ON public.tournaments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create tournaments" ON public.tournaments FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update tournaments" ON public.tournaments FOR UPDATE USING (auth.uid() = creator_id);

-- Tournament participants
CREATE TABLE public.tournament_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  elo INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tournament participants" ON public.tournament_participants FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can join tournaments" ON public.tournament_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave tournaments" ON public.tournament_participants FOR DELETE USING (auth.uid() = user_id);

-- Add invite_code to profiles for friend invites
ALTER TABLE public.profiles ADD COLUMN invite_code TEXT UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 10));

-- Backfill existing profiles
UPDATE public.profiles SET invite_code = upper(substr(md5(user_id::text || random()::text), 1, 10)) WHERE invite_code IS NULL;

-- Enable realtime for rooms and invites
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_invites;

-- Triggers for updated_at
CREATE TRIGGER update_battle_rooms_updated_at BEFORE UPDATE ON public.battle_rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
