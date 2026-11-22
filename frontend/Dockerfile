FROM node:20-alpine AS Builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .
RUN chmod -R +x node_modules/.bin || true
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=Builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
