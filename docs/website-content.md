# 官网公共内容维护

## 页面与数据

- `src/pages/index.astro`：首页编排与界面展示。保留 `#download`、`#features`，供现有分享承接页面链接。
- `src/data/site.ts`：品牌入口、功能场景、九篇使用指南和更新记录。文章通过 `src/pages/guides/[slug].astro` 生成。
- `src/pages/start/index.astro`：系统要求、App Store 下载/二维码、微信小程序入口与 Android 测试状态。
- `src/pages/features/index.astro`：功能对照、平台支持标签和界面展示。支持范围修改时同步检查 `site.ts`。
- `src/components/SiteHeader.astro`、`src/components/site/SiteFooter.astro`、`src/styles/site.css`：公共导航、页脚与样式。其余业务页面继续使用原有布局与实现。

每次发布先核对已正式分发且开放的能力，再更新官网；源码存在、开发截图或历史 tag 不单独证明公开上线。不要虚构平台版本、日期、下载链接、用户数量或评价。

## 平台事实（2026-11-15 核对）

### Apple

Apple 官方 `https://itunes.apple.com/lookup?id=6785364401&country=cn`：

- 当前正式版 `1.1.0`，`currentVersionReleaseDate=2026-11-13T22:21:27Z`，中日日期均为 11 月 14 日。
- 最初发行日 `releaseDate=2026-11-11T08:00:00Z`。
- iOS / iPadOS 18.6 起。
- App Store 兼容说明为 iPad App 在 Apple M1 或更新芯片、macOS 15.6 或更高版本运行；不是独立原生 Mac 正式分发的证据，兼容性以商店为准。
- 1.1.0 更新摘要依据商店正式文案，不能把后续未提交的开发改动混入。

### Android

安全同步后，本地及远端 `main` 均为 `2e6df0d80a1c20199e8dbdb6af8f5b5179134a08`，同 SHA 的 `v0.1.0-beta.18` 为测试版本，2026-11-02 发布。最低 Android 8.0，支持手机与平板设计。仓库私有，不对官网访客提供私有 GitHub APK 链接；本轮仅展示测试状态与界面，引导微信小程序。不宣称已上架 Google Play。

Android 测试版尚不具备 Apple 最新的全部官方服务；萌新招待、陆行鸟礼物站和水晶冲突排行榜以 Apple 正式版为准。Android 支持邮箱与密码，不提供 Apple 登录。

### 微信

公开内容只介绍微信小程序「FF14检索工具」。用户提供的官方码原图 `/Users/arins/Downloads/gh_e7be09423479_258.jpg` 已原样复制到 `public/brand/wechat-miniapp-code.jpg`，258×258；不要裁切、重绘或替换成官网链接二维码。保留名称复制与微信搜索步骤作为补充入口。不将复制按钮标为“打开小程序”，不承诺外部浏览器自动跳转。

## 数据保存说明

账号数据只对服务端保存、且各客户端已支持的内容承诺同账号访问。Apple 的市场关注、市场材料清单、天气目标、搜索历史、编辑草稿与叨鱼账号记录等保存在本机；外观和字体也是设备偏好。不能笼统宣传“所有收藏/清单/设置跨端同步”。已有两个账号不自动合并或迁移。

## 截图

- 旧三张 `src/assets/home/` 仍为 1.0.0 App Store 展示图，出处与 SHA 见 `docs/homepage-assets.md`。
- `src/assets/screenshots/apple/iphone-workbench.png`、`iphone-blue-mage-detail.png`、`ipad-gearing.png`：2026-11-15 当前开发构建的真实界面，使用隔离 Mock 账号和 fixture。只展示已由正式版事实核对的功能。iPad 配装图已隐藏侧栏，避免展示尚未公开宣传的入口。页面注明演示/示例数据，不把示例数字当线上统计。
- `src/assets/screenshots/android/workbench.png`、`market-detail.png`：最新原版签名 beta.18 APK 在 Android API 36 模拟器中的简中游客截图，使用公开线上只读数据，无个人账号、无 Mock。
- Astro `Image` 在构建时生成 WebP。源图没有修改内容；CSS 可用于网页中的展示窗口，不能改变图中信息的含义。
- 研究原始输出、APK、商店响应与 QA 截图放 `.tmp/`，已忽略，不进入站点源码发布。

## 验证与部署准备

使用现有 `pnpm test`、`pnpm test:browser`、`pnpm build` 与 `git diff --check`。公共页额外检查 1440 / 834 / 390 视口、图片、导航、官方入口、指南搜索/分类/空态、名称复制与站内链接。只用既有 Playwright Chromium、隔离浏览器上下文访问 localhost；不借用 Safari 账号或后台。

本站仍为原 Astro 静态站，未迁移托管。正式发布命令为 `pnpm build:sh`，目标 `lite:/var/www/astria`；脚本清空目标目录后解压，发布前须按 `../astria-backend/docs/operations/production-deploy.md` 核对长期文件和审批边界。正式提交与上线状态以发布记录为准。官网内容发布不需要更改 nginx 或后端配置；部署前先备份现站，并核对 `.well-known` 与验证文件均在构建产物中。

新增公共导航不将 App 专属年度回顾加入公开功能入口。现有 legal、注销、分享、绑定与 recap 业务保留。SEO 细则见 `docs/seo.md`：公共内容与注销说明使用干净生产 canonical；分享、绑定、回顾壳统一 noindex，且排除在站点地图之外。

## 功能专题与搜索内容

`src/data/feature-pages.ts` 维护六个具体功能专题，由 `src/pages/features/[slug].astro` 生成，功能索引、相关功能和指南提供内链。更新实际功能或端支持范围时，连同这些专题一起核对。品牌社交卡片和元数据在 `src/lib/seo.ts`、`src/layouts/SiteLayout.astro`，构建后执行 `pnpm check:seo` 检查产物；完整查询意图映射与搜索引擎发布后检查见 `docs/seo.md`。
