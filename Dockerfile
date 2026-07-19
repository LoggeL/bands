FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY bands.json /usr/share/nginx/html/bands.json
COPY previews/ /usr/share/nginx/html/previews/
EXPOSE 3000
