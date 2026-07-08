-- Migration: Add RPC function for checking email availability
-- This function can be called by anonymous (unauthenticated) users during registration
-- to check if an email is already registered.

CREATE OR REPLACE FUNCTION check_email_available(p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = LOWER(TRIM(p_email))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION check_email_available(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_email_available(TEXT) TO authenticated;
