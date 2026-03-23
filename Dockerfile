FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY bands.json /usr/share/nginx/html/bands.json
COPY previews/ /usr/share/nginx/html/previews/
EXPOSE 80
