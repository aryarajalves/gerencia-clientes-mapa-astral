# Estágio de Build
FROM node:18-alpine as build

WORKDIR /app

# Copia package.json primeiro para cache de dependências
COPY package.json package-lock.json ./
RUN npm ci

# Copia resto dos arquivos
COPY . .

# Argumentos de Build (Para injetar VITE_API_URL se necessário)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build
RUN npm run build

# Estágio de Produção
FROM nginx:alpine

# Copia o build
COPY --from=build /app/dist /usr/share/nginx/html

# Copia configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
