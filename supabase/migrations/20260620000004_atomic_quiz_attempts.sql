-- Atomic quiz attempt registration to prevent concurrent attempt bypass

CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_quiz_id uuid,
  p_user_id uuid,
  p_score integer,
  p_passed boolean,
  p_answers jsonb
)
RETURNS TABLE (
  attempt_id uuid,
  attempts_used integer,
  attempts_allowed integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts_allowed integer;
  v_attempts_used integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_quiz_id::text, 0));

  SELECT q.attempts_allowed
    INTO v_attempts_allowed
  FROM public.quizzes q
  WHERE q.id = p_quiz_id;

  IF v_attempts_allowed IS NULL THEN
    RAISE EXCEPTION 'Quiz não encontrado'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT COUNT(*)
    INTO v_attempts_used
  FROM public.quiz_attempts qa
  WHERE qa.user_id = p_user_id
    AND qa.quiz_id = p_quiz_id;

  IF v_attempts_used >= v_attempts_allowed THEN
    RAISE EXCEPTION 'Limite de tentativas atingido'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.quiz_attempts (
    user_id,
    quiz_id,
    score,
    answers,
    passed
  )
  VALUES (
    p_user_id,
    p_quiz_id,
    p_score,
    p_answers,
    p_passed
  )
  RETURNING id INTO attempt_id;

  attempts_used := v_attempts_used + 1;
  attempts_allowed := v_attempts_allowed;
  RETURN NEXT;
END;
$$;
