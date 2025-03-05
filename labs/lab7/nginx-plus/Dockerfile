# NginxPlus with Agent and NJS and Prometheus modules
# Nginx One Workshop - Internal F5
# Chris Akker, Shouvik Dutta, Adam Currier - Mar 2025
#
FROM private-registry.nginx.com/nginx-plus/agent:r32
COPY --from=private-registry.nginx.com/nginx-plus/modules:r32-prometheus-debian usr/ /usr/
#
# Download the apt configuration to `/etc/apt/apt.conf.d`:
RUN wget -P /etc/apt/apt.conf.d https://cs.nginx.com/static/files/90pkgs-nginx
#
# Install prerequisite packages:
RUN apt-get update && apt-get install -y apt-transport-https lsb-release ca-certificates curl wget gnupg2 net-tools vim tree openssl jq
#
# Copy certificate files and dhparams
COPY etc/ssl /etc/ssl
#
# COPY /etc/nginx (Nginx configuration) directory
COPY etc/nginx /etc/nginx
RUN chown -R nginx:nginx /etc/nginx \
# # Forward request logs to Docker log collector:
# && ln -sf /dev/stdout /var/log/nginx/access.log \
# && ln -sf /dev/stderr /var/log/nginx/error.log \
# Remove the cert/keys from the image
# && rm /etc/ssl/nginx/nginx-repo.crt /etc/ssl/nginx/nginx-repo.key
#
# COPY /usr/share/nginx/html (Nginx files) directory
COPY usr/share/nginx/html /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html
#
# COPY /etc/prometheus (Prometheus files) directory
COPY /etc/prometheus /etc/prometheus
RUN chown -R nginx:nginx /etc/prometheus
#
# EXPOSE ports, HTTP 80, HTTP 8080, HTTPS 443, Nginx API / status page 9000, Prometheus Exporter page 9113
EXPOSE 80 443 8080 9000 9113
STOPSIGNAL SIGTERM
CMD ["nginx", "-g", "daemon off;"]
