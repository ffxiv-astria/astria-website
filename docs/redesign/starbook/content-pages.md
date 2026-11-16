# Starbook 公共内容页

本轮把功能介绍、开始使用、帮助中心和更新日志接续到首页的星空手账视觉。没有新增功能或分发渠道，没有修改 `site.ts`、`feature-pages.ts` 中的事实、指南正文与版本日期。

## 维护边界

- `src/layouts/StarbookLayout.astro` 保留底层 `Layout.astro` 的 canonical、OG/Twitter、JSON-LD 与 noindex 契约，并为公共内容页提供新导航、页脚和小屏纸签导航。
- `src/components/starbook/StarbookHeader.astro`、`StarbookFooter.astro` 与 `src/styles/starbook-chrome.css` 由首页和本轮内容页共用。首页头部仍使用原 `#features`、`#ipad`、`#download` 链接；内页使用绝对站内地址。600px 以下页头保留品牌与下载，内页下方补四类页面入口，页脚也完整保留公共与法律链接。
- `src/styles/starbook-content.css` 仅由新内容布局加载，不导入首页拼贴 CSS。正文继续用系统字体，标题使用 Noto Serif SC，手写短句使用 Long Cang。纸页中的长文保持直立，旋转只用于照片和胶带等装饰。
- `src/styles/starbook.css` 继续服务首页；`src/components/starbook/Polaroid.astro` 与首页交互未改。字体声明从该文件抽到独立的 `starbook-fonts.css`，与内容页复用。
- 功能索引、六篇专题和开始使用的专用布局在各自 Astro 页面；指南、文章和日志也使用页面内 scoped CSS，避免跨页覆盖。
- 法律、账号注销、分享、玩家挑战承接、回顾与叨鱼绑定页面不接入此主题；旧 `SiteLayout`、`SiteHeader` 与 `site.css` 为它们保留，不扩大改造范围。

## 内容和交互

微信官方小程序码继续引用 `/brand/wechat-miniapp-code.jpg` 原文件；搜索名、复制成功/失败反馈、微信搜索步骤均保留。App Store 使用原官方徽章，高 50px、周围 12.5px 留白；系统要求、Mac 兼容说明和 Android 测试状态不变。

帮助中心继续支持关键词与分类组合过滤、结果计数、空态和重置聚焦；文章目录、相关指南、账号注销、邮箱以及专题间关联链接全部保留。SEO 路径与收录集合不变。本轮不新增更新日志条目，避免把尚未发布的视觉改版写成已上线事实。

## 字体和验证

字体子集脚本同时采集首页与内容页实际标题、标签和动态反馈，长文正文保持系统字体。`starbook-fonts.css` 由脚本按 manifest SHA 生成带内容版本查询的 URL，防止同名字体缓存仍使用旧字表；固定来源与三份原样 OFL 见 `fonts.md`。

验证使用现有五项命令与本机 Playwright：`pnpm test`、`pnpm test:browser`、`pnpm build`、`pnpm check:seo`、`git diff --check`。截图和交互/链接审计仅放 ignored `.tmp/qa/starbook-content/`，不把过程文件带入源代码。
