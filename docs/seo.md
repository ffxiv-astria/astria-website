# 官网搜索内容与收录维护

## 查询意图与页面

官网介绍工具与使用方式，实际资料查询、规划和账号操作在 App 或微信小程序中完成。正文与搜索描述都应保持这个边界，不能把功能介绍写成网页版查询服务。

| 玩家搜索意图 | 主要页面 | 内容边界 |
| --- | --- | --- |
| 天穹、Astria、FF14 国服工具 | `/` | 品牌、功能概览和使用入口 |
| FF14 道具查询、配方、任务、副本、NPC | `/features/game-data/` | 从道具沿关联资料查来源与用途 |
| FF14 市场价格、Universalis、材料清单 | `/features/market/` | 服务器/品质/挂单/成交、清单估价与时效 |
| FF14 采集时钟、天气预报 | `/features/gathering-weather/` | 采集窗口、地区天气与本机目标 |
| FF14 房屋查询、房屋订阅 | `/features/housing/` | 筛选、资格、订阅与通知边界 |
| FF14 Asvel 配装器、配装方案 | `/features/gearing/` | 方案、清单、保存与分享 |
| FF14 青魔法书、青魔技能、九宫幻卡图鉴 | `/features/collections/` | 学习线索、卡牌来源和收集目标 |
| 天穹下载、微信小程序入口 | `/start/` | 官方 App Store 与用户提供的小程序码 |
| 账号同步、价格延迟、房屋订阅和分享问题 | `/guides/` 及独立文章 | 具体可操作的帮助内容 |

新增功能介绍先确认真实功能和发布端，再在 `src/data/feature-pages.ts` 增加有实际内容的场景说明。独立页面由 `src/pages/features/[slug].astro` 生成，功能索引提供 HTML 链接，相关功能与指南互相连接。不要按同义词批量生成重复或薄内容页面。

## 元数据与结构化数据

- `astro.config.mjs` 固定生产域名和目录斜杠；`src/lib/seo.ts` 生成无查询参数的规范地址与 JSON-LD。
- 公共 `SiteLayout` 页有唯一 title/description、生产 canonical、OG/Twitter 信息与 1200×630 品牌分享图。
- JSON-LD 包括 WebSite、真实品牌发布者、WebPage、指南 Article 与 BreadcrumbList。不添加不存在的站内全局 SearchAction，也不伪造评价、评分、下载数或文章发布日期。
- 本轮没有为 App 添加 Google 软件富结果标记，因为它要求真实评分或评价，当前页面未展示这些信息；不为取得富结果资格补造字段。
- 分享图源为 `src/assets/brand/astria-social-card.svg`，输出为 `public/brand/astria-social-card.png`，使用现有品牌图标和实际功能文案。

## 抓取与隐私边界

站点地图只列入可公开索引的内容。分享预览、玩家挑战承接、App 专属回顾与绑定中转由 Layout 路径策略输出 `noindex, nofollow`，不加入 sitemap。robots 不是账号访问控制；分享与回顾壳允许爬虫读取 noindex。绑定中转仍禁抓，不对外链接。

`/account-deletion/` 保留公开说明与验证入口的索引，规范地址不带查询参数。处理状态的回执秘密保存在浏览器 localStorage，并通过私有请求头查询；不写入构建产物或 sitemap。若以后改为服务端渲染个人处理状态，必须重新审查其索引与缓存策略。

每次修改后执行 `pnpm build`、`pnpm check:seo`。校验直接读取构建 HTML：规范地址、唯一标题与描述、社交图片、JSON-LD、面包屑、站点地图覆盖、功能页内链以及私有壳 noindex。

## 发布后仍需要做的事

本轮没有操作搜索引擎账号，也没有宣称已经收录或排名提升。正式发布后，可在已验证的 Google Search Console、Bing Webmaster Tools 和百度搜索资源平台提交生产 sitemap，检查代表页面的抓取、规范地址与索引状态，再根据真实查询和点击数据持续改进内容。新增的验证文件必须进 `public/`，避免下次整站部署时被清除。

结构化数据与 sitemap 只能帮助搜索引擎发现和理解内容，不保证索引、富结果或排名。不要购买链接、堆叠关键词或使用隐藏正文。

## 官方依据

- [Google SEO 入门指南](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)：有帮助的内容、清晰页面标题和可抓取链接。
- [站点名称](https://developers.google.com/search/docs/appearance/site-names)：首页 WebSite 标记与一致品牌名称。
- [面包屑结构化数据](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)：表达真实页面层级。
- [站点地图](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)：只提供希望收录的规范绝对 URL。
- [robots.txt 边界](https://developers.google.com/search/docs/crawling-indexing/robots/intro)：Disallow 不等于禁止索引；爬虫需要读取 noindex。
- [软件应用富结果要求](https://developers.google.com/search/docs/appearance/structured-data/software-app)：要求真实评分或评价，不能伪造。
- [Astro 静态端点](https://docs.astro.build/en/guides/endpoints/)：构建输出站点地图。
