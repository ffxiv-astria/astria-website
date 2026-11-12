# 官网首页与图标素材

本次正式上线首页仅提供 App Store 正式版入口：
`https://apps.apple.com/app/id6785364401`。
不展示 TestFlight 或 Android 侧载下载入口，不宣传玩家挑战。

## App 画面

`src/assets/home/` 的三张原图来自已有的 iOS 1.0.0 简体中文
App Store 展示截图，原始截图内容未修改。由 Astro `Image` 在构建时
生成适合网页展示的 WebP 和响应式尺寸。

| 文件 | 内容 | 原始文件 SHA-256 |
| --- | --- | --- |
| `game-data.png` | 游戏资料、道具与制作配方 | `bae55e690413332257db267816388b0e00fc916ab1a5c91f83991f5d09f084c6` |
| `market.png` | 市场行情、价格曲线与概览 | `6f7c1c1c6c0efe8119a9886f73ea0d50bc6d547170fe97768f1f7d06056b47db` |
| `party-finder.png` | 跨服招募与分类 | `90b05577ef9599dc8892da29da9e168023a8149298c3a189d47e967de859b7cd` |

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
首页首屏使用一个徽章，高度 50px，四周留白 12.5px；底部使用普通文字链接。
两处均指向 App Store 正式版，不引入其他分发渠道。
