-- Check user password status
-- Run this to see if the user has a password set

SELECT 
  id, 
  email, 
  role,
  CASE 
    WHEN password IS NULL THEN 'NO PASSWORD'
    WHEN password = '' THEN 'EMPTY PASSWORD'
    ELSE 'HAS PASSWORD'
  END as password_status,
  "isVerified",
  "isActive"
FROM users
WHERE email = 'hevegot874@inilas.com';
