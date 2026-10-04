# second-saturn

Astria天穹官网与年度回顾 Web 展示项目，基于 Astro 构建为静态站点。

当前生产域名：

```text
https://astria.cxmeow.top
```

## 项目定位

`second-saturn` 是 Astria 的公共 Web 入口，不内置在 App 包内。App 通过 WKWebView 加载远程页面，并只向年度回顾页面注入安全裁剪后的展示数据。

当前承担的页面：

- 官网首页、下载入口、功能介绍
- 隐私政策、服务协议
- 账号注销说明、邮箱/Apple 身份验证、数据影响预览、提交与回执状态查询
- 超域旅行年度回顾 Web 展示
- App 内 WKWebView 使用的轻量回顾页面

年度回顾的数据统计、隐私裁剪和 payload 生成由 App 负责；Web 只负责视觉、动画、分镜、交互和分享图生成。

## 技术栈

- Astro 7
- TypeScript
- `html-to-image` 用于在浏览器端生成分享图 PNG
- pnpm

Node.js 要求：

```text
>= 22.12.0
```

## 路由

| 路由 | 用途 |
| --- | --- |
| `/` | 官网首页、下载入口、功能介绍 |
| `/legal/privacy` | 隐私政策 |
| `/legal/terms` | 服务协议 |
| `/account-deletion` | 账号注销说明与入口 |
| `/recap/travel` | 超域旅行年度回顾页面 |
| `/recap/travel/embed` | App 内 WKWebView 轻量版本 |
| `/travel-annual-recap` | 历史兼容入口，跳转到 `/recap/travel` |
| `/s/<code>` | 分享短链承接页（静态壳，nginx 把 `/s/*` 回落到 `/s/index.html`；本地预览用 `/s/?c=<code>`） |
| `/.well-known/apple-app-site-association` | iOS Universal Links 声明，只认领 `/s/*`；需以 `application/json` 返回 |

年度回顾是 App 专属入口功能，首页和官网导航不主动指向它。

账号注销页是独立浏览器入口，不通过 App 内嵌 WebView 承载。iOS 使用原生注销界面；两端共享同一组后端删除状态机和回执查询接口。

## 目录结构

```text
src/
  components/                Astro 组件
  data/                      年度回顾 demo payload 与类型
  layouts/                   公共页面布局
  pages/                     Astro 路由页面
  scripts/travelRecapClient.ts
                              年度回顾运行时、payload 注入、翻页、分享图
docs/
  recap-payload.schema.json  RecapPayload JSON Schema
  recap-payload-example-*.json
                              payload 示例
  travel-recap-coverage.md   指标覆盖说明
  wkwebview-integration.md   App 接入说明
scripts/
  deploy-dist.sh             构建并上传 dist 到服务器
public/
  brand/                     品牌素材
```

## 开发

安装依赖：

```sh
pnpm install
```

启动开发服务器：

```sh
pnpm dev
```

本仓库约定优先使用 Astro 后台开发模式：

```sh
pnpm exec astro dev --background
pnpm exec astro dev status
pnpm exec astro dev logs
pnpm exec astro dev stop
```

构建：

```sh
pnpm build
```

本地预览生产构建：

```sh
pnpm preview
```

年度回顾本地检查：

```text
http://127.0.0.1:4321/recap/travel/embed?demo=1
http://127.0.0.1:4321/recap/travel/embed?demo=minimal
http://127.0.0.1:4321/recap/travel/embed?debug=invalid
```

默认的 `/recap/travel/embed` 会停在等待 App 注入数据的准备页。

## 部署

生产构建输出到 `dist/`。

一键构建并上传：

```sh
pnpm build:sh
```

等价命令：

```sh
pnpm deploy:dist
```

部署脚本默认配置：

```text
DEPLOY_HOST=lite
DEPLOY_DIR=/var/www/astria
```

可通过环境变量覆盖：

```sh
DEPLOY_HOST=lite DEPLOY_DIR=/var/www/astria pnpm build:sh
```

脚本会：

1. 执行 `pnpm build`
2. 将 `dist/` 打包为 `.tmp/deploy-dist/second-saturn-dist.tar.gz`
3. 上传到远端 `~/second-saturn-dist.tar.gz`
4. 清空远端目标目录的一层内容
5. 解压新版本到 `DEPLOY_DIR`
6. 清理本地和远端临时包

## 年度回顾接入

### 数据边界

App 负责：

- 读取和统计超域旅行缓存
- 计算最近 365 天窗口内指标
- 读取全部历史数据用于跨窗口推导和彩蛋
- 裁剪 `RecapPayload`
- 移除订单号、账号 ID、SNDA ID、凭证等敏感信息
- 通过 WKWebView 注入 payload

Web 负责：

- payload 校验
- 分镜排序与展示
- 移动端一屏式翻页体验
- 图表与视觉效果
- 分享图生成
- 向 App 发送 bridge 事件

角色名允许展示。订单号、账号 ID、SNDA ID、凭证、原始官方账号标识不应进入 payload。

### Payload 文档

参考：

- [`docs/recap-payload.schema.json`](docs/recap-payload.schema.json)
- [`docs/recap-payload-example-minimal.json`](docs/recap-payload-example-minimal.json)
- [`docs/recap-payload-example-full.json`](docs/recap-payload-example-full.json)
- [`docs/wkwebview-integration.md`](docs/wkwebview-integration.md)
- [`docs/travel-recap-coverage.md`](docs/travel-recap-coverage.md)

当前 schema 版本：

```json
{
  "schemaVersion": 1
}
```

### 注入方式

推荐 App 在页面 runtime 准备好后调用：

```js
window.AstriaRecap.render(payload);
```

也支持：

```js
window.__ASTRIA_RECAP_PAYLOAD__ = payload;
```

```js
window.postMessage({ type: 'astria:recap-payload', payload }, '*');
```

页面还暴露：

```js
window.AstriaRecap.createShareImage();
window.AstriaRecap.getPayloadStatus();
window.AstriaRecap.showEmpty();
```

### WKWebView Bridge

Web 会同时发出浏览器事件和 WKWebView message：

```js
window.addEventListener('astria:recap-event', (event) => {
  console.log(event.detail.type, event.detail.payload);
});
```

WKWebView handler 名称：

```swift
configuration.userContentController.add(handler, name: "astriaRecap")
```

消息格式：

```ts
{
  type: string;
  payload: object;
  schemaVersion: 1;
  timestamp: string;
}
```

常用事件：

| 事件 | 说明 |
| --- | --- |
| `recap-ready` | 页面 runtime 已加载 |
| `recap-payload-accepted` | payload 校验通过，已进入开始页 |
| `recap-payload-rejected` | payload 校验失败 |
| `recap-started` | 用户点击“开始回顾” |
| `recap-slide-changed` | 当前页变化 |
| `recap-boundary-reached` | 用户到达首页/末页边界后继续翻页 |
| `recap-close-requested` | Web 请求 App 关闭回顾 |
| `share-image-created` | 分享图 PNG 已生成 |
| `share-image-failed` | 分享图生成失败 |

`recap-payload-accepted` 会带上：

```ts
{
  slideCount: number;
  coreSlideCount: number;
  optionalSlideCount: number;
}
```

`share-image-created` 会带上：

```ts
{
  dataUrl: string;
  format: "image/png";
  title: string;
}
```

### 幻灯片规则

页面会对 `slides` 按 `priority` 排序，同优先级按原始顺序。

核心页：

```json
{
  "optional": false,
  "priority": 10
}
```

条件页：

```json
{
  "optional": true,
  "priority": 120,
  "triggerReason": "鸟区 18:00-21:00 成功出发次数大于 0",
  "emptyBehavior": "hide"
}
```

可用的 `emptyBehavior`：

- `hide`
- `show-empty`
- `show-muted`

分享图 variant：

- `standard`
- `chocobo-rush`
- `zero-page`
- `gatekeeper`
- `quiet-window`

## 安全约束

- 生产环境必须使用 HTTPS。
- App 侧 WKWebView 只允许加载 `astria.cxmeow.top`。
- 年度回顾页面默认不上传 payload。
- 不在年度回顾页面引入第三方统计、广告或远程脚本。
- 不把订单号、账号 ID、SNDA ID、凭证、原始官方账号标识放进 payload。
- 分享图只使用展示所需数据。

建议 CSP 基线：

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://appleid.cdn-apple.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://ff14search.cxmeow.top https://appleid.apple.com; frame-src https://appleid.apple.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://appleid.apple.com
```

## 维护提示

- 新增官网页面时放到 `src/pages/`，共用布局优先复用 `Layout.astro`、`SiteHeader.astro`、`LegalShell.astro`。
- 年度回顾的 App 内页面应保持移动端一屏体验，不做桌面大屏主适配；大屏由 App 侧限制 WKWebView 宽度。
- 年度回顾对用户可见文案不要出现工程说明、隐私实现说明、统计窗口解释等产品注释。
- 修改 `RecapPayload` 字段时，同步更新 schema、示例 payload、App 构建器和 WKWebView 文档。
