-- Guarda o tipo de mídia (Foto/Vídeo) de cada story sincronizado pela API, pra ajudar
-- a identificar o conteúdo depois (junto com a hora exata e a legenda, quando existir).
alter table story_posts add column if not exists media_type text;
