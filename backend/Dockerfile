FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=development
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install --include=dev
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma
RUN npx prisma generate
EXPOSE 4000
CMD ["npm", "run", "dev"] 