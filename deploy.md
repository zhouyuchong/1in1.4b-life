# 🐳 Docker 生产环境一键部署指南

本项目已配置 **Docker 多阶段构建**。即使服务器上没有安装 Node.js、npm 或 Nginx，只需要有 Docker 即可完成从代码构建到生产静态托管的全部流程。

---

## 🚀 极简部署三步法

### 1. 克隆代码并进入目录
```bash
git clone https://github.com/zhouyuchong/1in1.4b-life.git
cd 1in1.4b-life
```

### 2. 构建 Docker 镜像
在项目根目录下执行（容器内会自动执行依赖安装与打包，耗时约 30 秒）：
```bash
docker build -t 1in1.4b .
```

### 3. 运行容器并指定端口

根据你的需求，挑选以下任意一个端口运行：

#### 🌟 选项 A：推荐直接用 `80` 端口（浏览器免输端口号，体验最佳）
```bash
docker run -d --name 1in1.4b-app -p 80:80 --restart=always 1in1.4b
```
> 访问地址：`http://你的服务器IP`

#### 选项 B：使用经典 Web 端口 `8080`（如 80 端口被云厂商限制未备案）
```bash
docker run -d --name 1in1.4b-app -p 8080:80 --restart=always 1in1.4b
```
> 访问地址：`http://你的服务器IP:8080`

#### 选项 C：专属“十四亿”数字彩蛋端口 `1414`
```bash
docker run -d --name 1in1.4b-app -p 1414:80 --restart=always 1in1.4b
```
> 访问地址：`http://你的服务器IP:1414`

---

## 🛠️ 常用运维命令

- **查看容器运行状态**：
  ```bash
  docker ps
  ```
- **查看实时访问/运行日志**：
  ```bash
  docker logs -f 1in1.4b-app
  ```
- **停止 / 重启容器**：
  ```bash
  docker restart 1in1.4b-app
  docker stop 1in1.4b-app
  ```
- **删除容器**：
  ```bash
  docker rm -f 1in1.4b-app
  ```

---

## 🔄 代码更新后重新部署

当远程仓库有新功能或数据更新时，登录服务器执行以下命令即可平滑重新部署：

```bash
cd 1in1.4b-life
git pull
docker build -t 1in1.4b .
docker rm -f 1in1.4b-app
docker run -d --name 1in1.4b-app -p 80:80 --restart=always 1in1.4b
```

---

## ⚠️ 防火墙与安全组检查
- **云控制台安全组**：请登录你的云服务商控制台（如腾讯云/阿里云/AWS等），在服务器安全组的“入方向规则”中，放行你所指定的端口（如 `80`、`8080` 或 `1414`）的 TCP 流量。
