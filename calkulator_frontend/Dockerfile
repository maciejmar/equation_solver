# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS build

# metadane/wersjonowanie (opcjonalnie przekazuj przez --build-arg)
ARG VERSION=dev
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.title="calkulator_frontend" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${GIT_SHA}"

WORKDIR /app

# 1) instalacja zależności (deterministycznie)
COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

# 2) tylko pliki potrzebne do kompilacji
COPY angular.json tsconfig*.json ./
COPY src ./src
# jeżeli masz dodatkowe assets poza src/assets – dodaj je jawnie

# 3) build produkcyjny
RUN npx ng build calkulator_frontend --configuration production
# -------- Stage 2: runtime (nginx) --------
FROM nginx:alpine

# (opcjonalnie) własny nginx.conf, np. do proxy_pass /api
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# 4) kopiujemy tylko statyki
COPY --from=build /app/dist/calkulator_frontend /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Stage 1: Build the Angular app in a Node.js environment
# FROM node:18.17.1 as build
# WORKDIR /app
# COPY package.json package-lock.json ./
# RUN npm install
# COPY . .
# RUN npm run build --prod

# # Stage 2: Serve the Angular app with Nginx
# FROM nginx:alpine
# COPY --from=build /app/dist/calkulator_frontend /usr/share/nginx/html
# RUN chmod -R 755 /usr/share/nginx/html
# # If you have a custom Nginx configuration, uncomment and adjust the following line
# # COPY nginx.conf /etc/nginx/conf.d/default.conf

# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]

