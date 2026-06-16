# 设计师作品集 Portfolio

一个 Stripe / Vercel 风格的极简高质感作品集网站,展示 **AI 驱动的全链路设计师**。

## 快速开始

**方式 1:直接预览(最快)**

```bash
open index.html
```

**方式 2:本地服务器(推荐,部分浏览器对本地字体加载更友好)**

```bash
cd ~/Desktop/我的作品集
python3 -m http.server 5173
```

然后访问 http://localhost:5173

## 文件结构

```
我的作品集/
├── index.html        主页(单页长滚动)
├── css/
│   └── style.css     样式(深色 + 极简 + 渐变光晕)
├── js/
│   └── main.js       交互(滚动揭示 / 弹窗 / 筛选)
└── README.md
```

## 包含板块

1. **Hero** — 渐变光晕背景 + 动态首屏文案
2. **About** — 自我介绍 + 4 块核心能力卡片
3. **Selected Works** — STAR 原则案例(网上老年大学 / AI 客服 SaaS),含模拟 UI Mockup,点击查看完整复盘弹窗
4. **AIGC & Visual Exploration** — 视觉瀑布流 + 分类筛选 + AIGC 4 步工作流图
5. **Skills & Stack** — 4 维度能力卡片 + 日常工具集
6. **Contact** — 联系方式 + CTA

## 替换你自己的内容

- **文案**:直接编辑 `index.html` 中对应板块的文字
- **项目详情**:编辑 `js/main.js` 顶部的 `projects` 对象
- **作品图片**:将你的图片放入 `assets/` 目录后,把对应区域的 CSS 占位图(如 `.art-shape`、`.work-mockup`)替换为 `<img src="assets/xxx.png">`
- **主色**:在 `css/style.css` 的 `:root` 中修改 `--accent: #E66A40;` 即可统一换色

## 升级到 Next.js + Tailwind(可选)

当前为纯静态版本,无需任何依赖即可运行。
若需升级为 Next.js + Framer Motion + Tailwind 工程化版本,我可以基于这套设计稿继续重构,告诉我即可。

## 部署

```bash
# 一键部署到 Vercel
npx vercel

# 或拖拽整个文件夹到 https://app.netlify.com/drop
```
