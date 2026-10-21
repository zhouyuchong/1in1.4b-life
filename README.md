# 十四亿分之一 · 《生于此地》 (1 in 1.4 Billion: Born Here)

<p align="left">
  <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/"><img src="https://img.shields.io/badge/License-CC_BY--NC--SA_4.0-lightgrey.svg" alt="License: CC BY-NC-SA 4.0"></a>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/Vite-5.x-purple.svg" alt="Vite">
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="PRs Welcome">
</p>

> “站在无知之幕后，看看你将如何度过这一生。”

基于国家统计年鉴、第七次全国人口普查真实数据与当代社会重大议题改编的纪实人生体验。

---

## 💡 致敬与灵感来源 (Inspiration & Acknowledgement)

本项目在产品创意与交互形式上致敬了海外知名的全球人生概率项目：  
👉 **[1 in 8 Billion (1in8b.life)](https://1in8b.life/)**

**本项目在此基础上的中国本土化演进与深度定制：**
1. **全国地级颗粒度**：从原版的国家级粗粒度抽样，下沉至覆盖全国 **340+ 个地级行政区**（市、州、盟与直辖市圈层）及城乡二元加权。
2. **时代纪实叙事**：结合近三十年真实社会事件与社会学热点（从幼小衔接、中考分流、高考大省博弈，到考公考研、行业黑天鹅、35岁职场中年危机与养老医疗兜底）。
3. **真实统计排位**：终局对照全国居民可支配收入五等分位、大专以上受教育人口比重与期望寿命生成量化雷达图。

---

## 🌟 核心特色

1. **340+ 全国地级行政区出生加权系统**：
   - 覆盖全国 34 个省级行政区下辖的地级市、州、盟与直辖市圈层。
   - 严格基于国家统计年鉴与人口普查出生率进行加权抽样，还原真实的地域与城乡二元概率。
2. **每一年独立目录架构（极易扩展）**：
   - 0 岁至 80 岁每个年份均为独立子目录（`public/data/ages/age_0` ~ `age_80`）。
   - 内容创作者与运营者无需重新编译代码，直接修改或上传 JSON 文件即可实时生效。
3. **真实社会热点与知名案例改编抉择**：
   - 涵盖：幼小衔接抢跑、学区房划片、中考普职分流、张雪峰式志愿填报、考研考公大军、大厂裁员与行业洗牌、掏空六个钱包上车房贷、35岁危机、大病互助筹款等。
4. **社交裂变海报生成**：
   - 终局根据真实统计指标生成量化排位雷达图，支持一键保存朋友圈/小红书长图。

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
├── LICENSE                   # CC BY-NC-SA 4.0 协议文件
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
# 1. 安装依赖
npm install

# 2. 启动本地开发服务 (默认 http://localhost:3000)
npm run dev

# 3. 编译生产打包
npm run build
```

---

## 📄 开源协议与非商业限制声明 (License)

本项目采用 **[CC BY-NC-SA 4.0 (知识共享-署名-非商业性使用-相同方式共享 4.0 国际许可协议)](https://creativecommons.org/licenses/by-nc-sa/4.0/)**。

### 🚫 严格禁止商业营利声明：
- **严禁商用**：本项目的所有源代码、原创事件数据、城市权重算法与衍生美术素材，**严禁用于任何形式的商业盈利行为**。包括但不限于：
  - 打包上架任何商业应用市场、小程序或 Steam 等平台进行付费售卖或内购；
  - 在项目中植入开屏广告、横幅广告、激励视频等任何第三方商业变现广告；
  - 换皮后用于任何商业宣传、付费咨询或付费引流活动；
  - 将事件数据库与权重算法提取为商业收费 API 服务。
- **允许非商业传播与学习**：个人学习、非营利性学术探讨、开源改进、高校社会学调研等非商业用途完全自由开放，但在分发或衍生作品中必须注明原作者署名与本项目开源地址，并以相同的 CC BY-NC-SA 4.0 协议共享。
