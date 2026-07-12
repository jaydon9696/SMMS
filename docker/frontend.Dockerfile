FROM node:22-slim AS builder

WORKDIR /app/frontend

ARG NEXT_PUBLIC_API_URL=/api/v1
ARG NEXT_PUBLIC_WS_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Production stage using Next.js standalone output
FROM node:22-slim AS runner

WORKDIR /app/frontend

ENV NODE_ENV=production

COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./.next/static
COPY --from=builder /app/frontend/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
