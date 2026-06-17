
FROM ghcr.io/pnpm/pnpm:latest

WORKDIR /usr/jp


FROM base as dev
RUN pnpm runtime set node 22 -g
COPY . .
RUN pnpm install --frozen-lockfile
