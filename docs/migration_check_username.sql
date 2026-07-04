-- Migration: Add RPC function for checking username availability
-- This function can be called by anonymous (unauthenticated) users during registration
-- to check if a username is already taken.

CREATE OR REPLACE FUNCTION check_username_available(p_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles WHERE username = LOWER(TRIM(p_username))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION check_username_available(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_username_available(TEXT) TO authenticated;
