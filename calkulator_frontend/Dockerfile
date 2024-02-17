# Stage 1: Build the Angular app in a Node.js environment
FROM node:18.17.1 as build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build --prod

# Stage 2: Serve the Angular app with Nginx
FROM nginx:alpine
COPY --from=build /app/dist/calkulator_frontend /usr/share/nginx/html
# If you have a custom Nginx configuration, uncomment and adjust the following line
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]