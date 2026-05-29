FROM mongo:7.0

# Installation
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm bun

WORKDIR /app


# Copie pour la mise en cache
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json .npmrc ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/utils/package.json ./packages/utils/

RUN pnpm install

COPY . .

# Rendre executable
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm build

EXPOSE 3000
EXPOSE 5173

ENV MONGODB_URI=mongodb://localhost:27017/ext

ENTRYPOINT ["./entrypoint.sh"]