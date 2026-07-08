-- Check auth.identities for any orphaned references to this email or username
SELECT * FROM auth.identities 
WHERE identity_data->>'email' = 'skuadkito@gmail.com'
   OR identity_data->>'sub' = 'skuadkito@gmail.com';
