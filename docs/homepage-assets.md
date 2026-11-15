# 官网首页与图标素材

首页提供 App Store 正式版入口及官方微信小程序码。App Store 地址：
`https://apps.apple.com/app/id6785364401`。
不展示 TestFlight 或 Android 侧载下载入口，不宣传玩家挑战。

## App 画面

`src/assets/home/` 原有的三张原图来自 iOS 1.0.0 简体中文 App Store 展示截图。Starbook 改版后，`game-data.png` 与 `market.png` 仍被功能专题引用，继续保留；旧 `party-finder.png` 已没有任何页面引用，本轮移除，下面保留它的历史来源与 SHA 记录。原图内容未修改，由 Astro `Image` 生成 WebP 与响应式尺寸。

| 文件 | 内容 | 原始文件 SHA-256 |
| --- | --- | --- |
| `game-data.png` | 游戏资料、道具与制作配方 | `bae55e690413332257db267816388b0e00fc916ab1a5c91f83991f5d09f084c6` |
| `market.png` | 市场行情、价格曲线与概览 | `6f7c1c1c6c0efe8119a9886f73ea0d50bc6d547170fe97768f1f7d06056b47db` |
| `party-finder.png`（已移除） | 跨服招募与分类 | `90b05577ef9599dc8892da29da9e168023a8149298c3a189d47e967de859b7cd` |

来源记录：iOS 仓库 `output/app-store/c-zh-hans/manifest.json`。
复用原图，不使用未发布功能、设计稿或后台截图。

## 网站图标

图标基于 `public/brand/astria-app-icon.png`（1024×1024），与 App 正式图标一致。
只做尺寸与文件格式转换，不修改图案。

- `public/favicon.ico`：真正的 ICO 容器，含 16、32、48、96 和 256 像素尺寸。
- `public/favicon.png`：96×96 PNG，供搜索引擎和浏览器使用。
- `public/apple-touch-icon.png`：180×180 PNG，供 Apple 添加到主屏幕使用。
- `Layout.astro` 为所有页面声明相同的稳定图标路径，移除 Astro 默认 SVG。

旧 `favicon.ico` 为使用 ICO 扩展名的 32×32 PNG，旧 SVG 为 Astro 默认图案。
线上旧文件均可公开访问；这些配置问题不足以证明 Google 未显示图标的唯一原因。
不存在 `robots.txt` 返回 404 本身不代表禁止抓取，因此不为修复图标而改写抓取规则。

参考 [Google 网站图标要求](https://developers.google.com/search/docs/appearance/favicon-in-search)：
首页与图标须可抓取，图标为正方形并建议大于 48 像素，URL 保持稳定。
部署后可在 Search Console 请求重新索引首页；搜索展示依赖重新抓取与处理，
不能由网站代码立即更新或保证显示。

## App Store 官方下载徽章

`public/brand/download-on-the-app-store-zh-cn.svg` 为 Apple 官方简体中文
黑色下载徽章，保持 SVG 原样，不重绘、变色、拉伸或添加动画。

来源：
`https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/zh-cn?size=250x83`
（Apple 官方营销素材服务，获取时跟随官方重定向。）

根据 [Apple 营销指南](https://developer.apple.com/app-store/marketing/guidelines/)，
Starbook 首页首屏与下载卡各使用一个徽章，高度 50px，四周留白 12.5px。
两处均指向 App Store 正式版，不引入其他 App 分发渠道。

## Starbook 星空手账首页（2026-11-16）

原始设计依据为 `docs/redesign/starbook/brief.md` 与 `reference.dc.html`；本轮最新验收依据为 `review-1.md`，石之家末句按用户后续明确指定的准确说法覆盖。所有原始输入保留。导航与页脚只在首页使用新样式，其他页面保持原状。

`src/assets/screenshots/apple/starbook/` 的十一张截图由用户提供：

| 文件 | 展示内容 |
| --- | --- |
| `item-amethyst.png` | 紫水晶道具、配方与材料 |
| `market-hot.png` | 市场热度榜 |
| `gatherer-clock.png` | 采集时钟与限时采集点 |
| `weather.png` | 地区天气与时间筛选 |
| `party-finder.png` | 跨服招募 |
| `housing.png` | 房屋信息与抽签阶段 |
| `gearing-square.png` | 配装广场 |
| `triple-triad.png` | 九宫幻卡 |
| `blue-mage.png` | 青魔法书 |
| `faux-hollows.png` | 幻巧拼图 |
| `pvp-rotation.png` | PvP 地图轮换 |

素材来自 2026-11-16 当前开发构建在 iPhone 17 Pro Max 模拟器的 Mock passthrough 模式，仅裁去状态栏；招募、配装等玩家列表是编造演示数据。`item-amethyst.png` 则由 1.0.0 App Store 展示图裁出界面、去掉营销标题。`housing.png` 中“3410 处”等为截图时公开线上数据。截图不证明未发布能力已上线；页面注明“界面示例；部分内容为演示数据，实际以客户端为准”。

首页 iPad 区继续使用 `src/assets/screenshots/apple/ipad-gearing.png`（2026-11-15 隔离 Mock 演示配装），用 CSS 按参考稿 16:10 窗口展示，并按 review-1 上移取景窗口排除顶部状态栏；600px 以下胶带收为 64px、移离内容标题，不改源图。全部截图通过 Astro Image 输出 WebP、响应式宽度与 sizes。

幻巧拼图与宏方案库已分别核对 Apple 官方商店当前 1.1.0 描述、发布标签 `1.1.0`（`800093ccfb45a8e0d7d5230014d5e9fdbfd21c99`）中的实际入口与页面、以及生产运行时配置，保持展示。生产配置版本为 0、功能覆盖为空，发布源码按缺项默认启用解释；宏广场匿名只读请求亦返回 200。采集提醒需在 App 按采集物开启并允许系统通知，不把“关注”或微信监控等同提醒；房屋订阅需登录，正文仅说明在消息中心查看匹配变化，不保证实时推送送达。具体核实证据记录在本轮验收报告中。

三款字体仅由首页专用 CSS 引用自托管 WOFF2 子集，正文继续使用系统字体；生成方法、锁定来源与许可证见 `docs/redesign/starbook/fonts.md`。

review-1 中 834px 及以下使用选中待办下方的 240px 小拍立得及说明，独立大照片隐藏；切换即时滚入可见区域，跨断点保留同一选中项与勾选状态。600px 以下页头只保留品牌和 36px 下载按钮，指南与更新日志入口保留在页脚。首屏前两张图注左右对齐，小屏分行保证不被前景照片遮挡。
