-- Login passa a exigir emailVerified = true. Usuários criados antes dessa
-- migration nunca tiveram a chance de verificar (a feature não existia), então
-- marcamos todos como já verificados pra não travar contas existentes. Só
-- cadastros novos, a partir de agora, nascem com emailVerified = false e
-- precisam confirmar o e-mail antes do primeiro login.
UPDATE "users" SET "emailVerified" = true WHERE "emailVerified" = false;
