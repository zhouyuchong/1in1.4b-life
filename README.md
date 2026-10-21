# 十四亿分之一 · 《生于此地》 (1 in 1.4 Billion: Born Here)

> “站在无知之幕后，看看你将如何度过这一生。”

基于真实统计数据与当代社会重大议题改编的纪实人生体验（类似 `1in8b.life` 的中国本土化纪实版本）。

---

## 🌟 核心特色

1. **340+ 全国地级行政区出生加权系统**：
   - 覆盖全国 34 个省级行政区下辖的地级市、州、盟与直辖市圈层。
   - 严格基于国家统计年鉴与人口普查出生率进行加权抽样，还原真实的地域与城乡二元概率。
2. **每一年独立目录架构（极易扩展）**：
   - 0 岁至 80 岁每个年份均为独立子目录（`public/data/ages/age_0` ~ `age_80`）。
   - 内容创作者与运营者无需重新编译代码，直接修改或上传 JSON 文件即可实时生效。
3. **真实社会热点与知名案例改编抉择**：
   - 包含：幼小衔接抢跑、小学学区房划片、中考普职五五分流、张雪峰式高考志愿大博弈、高校毕业季400万人考研与考公潮、行业黑天鹅（双减/大厂裁员）、掏空六个钱包上车房贷、35岁职场中年危机、大病筹款与医保兜底、银发晚年等。
4. **2核 4G VPS 极致友好**：
   - 纯前端客户端单页应用（SPA），总打包体积 gzip 后小于 80KB。
   - 零后端数据库负担，单台轻量 VPS 配 Nginx 即可从容承载千万级 PV 访问。
5. **社交裂变海报生成**：
   - 终局根据真实全国居民收入五等分位、大专以上学历比重、人均期望寿命生成排位雷达图，支持一键导出朋友圈/小红书长图。

---

## 📂 项目结构与年份目录说明

```text
1in1.4b-life/
├── public/
│   └── data/
│       └── ages/             # 0 ~ 80 岁独立年份数据目录
│           ├── age_0/
│           │   ├── events.json    # 当年日常/时代纪实事件库
│           │   └── choices.json   # 当年重大人生抉择卡牌
│           ├── age_1/
│           ...
│           ├── age_18/            # 高考与志愿填报大年
│           │   ├── events.json
│           │   └── choices.json
│           ...
│           └── age_80/
├── src/
│   ├── components/           # UI 组件 (Header, ChoiceCard, Timeline, Settlement等)
│   ├── data/
│   │   └── cities.js         # 全国 346 个地级市出生权重与指标库
│   ├── services/
│   │   └── lifeEngine.js     # 属性计算、马尔可夫演化与人口排位算法
│   ├── App.jsx
│   └── main.jsx
├── dist/                     # 生产打包产物（直接供 Nginx 托管）
└── package.json
```

---

## ✍️ 如何扩展与新增某一年的事件或抉择？

无需触碰任何前端代码，直接在对应年份目录下编辑 JSON 文件：

### 1. 扩充日常文本：`events.json`
```json
[
  {
    "id": "e_age18_custom",
    "condition": { "isRural": true },
    "text": "村里为你挂起了祝贺高考的横幅，同村的长辈纷纷赶来道喜。",
    "effect": { "sanity": 5 }
  }
]
```

### 2. 扩充重大转折：`choices.json`
```json
[
  {
    "id": "choice_custom_sample",
    "title": "事件标题",
    "description": "事件详细社会背景与起因",
    "sourceCase": "真实社会案例/新闻出处",
    "condition": {
      "minKnowledge": 50
    },
    "options": [
      {
        "text": "选项一描述",
        "requirements": { "wealth": 30 },
        "effect": { "wealth": -10, "knowledge": 8, "sanity": -2 },
        "tag": "新获得的人生标签",
        "resultText": "做出该选择后的纪实反馈文本"
      }
    ]
  }
]
```

---

## 🚀 本地开发与运行

```bash
# 安装依赖
npm install

# 启动本地开发服务 (默认 http://localhost:3000)
npm run dev

# 编译生产打包
npm run build
```

---

## 🌐 2核 4G VPS 部署指南

因为本项目是全静态架构，生产环境推荐直接用 Nginx 托管。

### 1. 编译并上传静态文件
在本地或服务器执行：
```bash
npm run build
```
将打包生成的 `dist` 目录上传至服务器 `/var/www/1in1.4b-life`。

### 2. Nginx 配置示例 (`/etc/nginx/conf.d/1in1.4b.conf`)
```nginx
server {
    listen 80;
    server_name your-domain.com; # 你的域名或服务器 IP

    root /var/www/1in1.4b-life/dist;
    index index.html;

    # 启用 Gzip 极速压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存配置
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # 年份 JSON 动态可读配置
    location /data/ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }
}
```
保存后重载 Nginx：
```bash
nginx -t && nginx -s reload
```
即可在浏览器中访问！在 2核 4G 的配置下，能轻松应对突发数万并发。
