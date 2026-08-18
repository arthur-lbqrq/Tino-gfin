# Build: instala tudo (incl. devDependencies), gera o client do Prisma e
# compila TS -> JS com os aliases @/ já reescritos pra caminho relativo
# (tsc por si só não faz isso — sem tsc-alias o build sobe e quebra na hora
# de importar qualquer módulo interno).
FROM node:20-alpine AS build
# O engine do Prisma precisa de libssl e não roda no Alpine puro (ele nem
# reporta um erro claro — só falha ao "conversar" com o binário do engine).
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# Runtime: só o necessário pra rodar — sem devDependencies, sem código fonte TS.
FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

EXPOSE 3333
# Aplica as migrations pendentes antes de subir — seguro de rodar em todo
# deploy: uma migration já aplicada é pulada, não reaplicada.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
