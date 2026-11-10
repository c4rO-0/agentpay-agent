FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY templates ./templates
COPY skills ./skills
COPY scripts ./scripts

EXPOSE 6471

CMD ["npm", "start"]
