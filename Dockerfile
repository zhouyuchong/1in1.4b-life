# 阶段 1：在容器内自动编译打包（无需宿主机安装 Node/npm）
FROM node:20-alpine AS builder

WORKDIR /app

# 优先拷贝依赖定义文件，利用 Docker 缓存层
COPY package*.json ./
RUN npm ci || npm install

# 复制项目代码并编译生成 dist
COPY . .
RUN npm run build

# 阶段 2：使用极简 Nginx 镜像托管前端静态产物
FROM nginx:alpine

# 将构建产物拷贝到 Nginx 托管目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 配置 SPA 路由重定向与 Gzip 缓存优化
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml; \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location /assets/ { \
        expires 1y; \
        add_header Cache-Control "public, no-transform"; \
    } \
    \
    location /data/ { \
        expires -1; \
        add_header Cache-Control "no-cache, must-revalidate"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
