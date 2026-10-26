# 玩家挑战分享入口

本仓实现 `/pc/index.html` 静态预览壳、受限公共预览解析及 Apple 关联声明。读取已有 `GET /api/share/links/:code`，只接受 `player_challenge`／`player_challenge_same_set`，不读取个人局或答案。作者文字用 `textContent` 渲染。所有外发分享链接均保留 `/pc/<code>`。

本地检查：`pnpm test`，`pnpm build`，`pnpm test:browser`（首次需准备 Playwright Chromium）。浏览器回归使用本机静态服务和合成 API 响应，不调用生产 API，覆盖 Android、Apple、微信、无 App 回退、撤销隐藏和旧 `/s/`。本地开发可访问 `/pc/?c=<8位码>`；正式地址需要下面的独立路由。`/s/` 原分享页保持现有行为。

## 待部署配置

以下片段供现有官网 nginx server 审阅、合并，不代表线上已执行：

```nginx
location = /pc {
    try_files /pc/index.html =404;
    add_header Cache-Control "no-store" always;
}
location ^~ /pc/ {
    try_files /pc/index.html =404;
    add_header Cache-Control "no-store" always;
}
```

`/pc/` 不代理或重定向到 `/s/`。API origin 通过 `PUBLIC_API_BASE_URL` 构建配置选择。当前静态壳使用固定站点 Open Graph 元信息，安全挑战预览由页面 resolver 读取；没有为新路径接入旧 `/s/` 的服务端动态HTML注入，不应将旧 landing 服务直接配置到新路径。

已有 `public/.well-known/apple-app-site-association` 新增 `/pc/*`，保留原 `/s/*`。上线时需核对内容类型与不重定向要求，并验证 Apple 关联缓存；本地文件存在不能证明 CDN／关联缓存已生效。Android manifest 本次不改，新路径不匹配旧版 `/s/` 接管。

## 验收边界

- Android Chrome、微信与 QQ：只展示网页、复制链接和小程序引导，不生成 Android 或通用 App 唤起动作。
- iPhone／iPad／Mac 外部浏览器：仅在 resolver 返回符合规范的 `astria://player-challenges/<UUID>` 时展示 Apple App 按钮；同题码 query 必须等于当前短码，普通挑战必须对应目标 ID。
- App 未安装或不支持：网页始终保留小程序码与复制入口；不定时自动跳转。Universal Links 的旧版本实际行为仍需要客户端发布后的设备验收。
- 同题分享展示短码与明确确认提示；页面加载、恢复可见及复制均不会开局、提交或自动继承筛选。
- 恢复网页可见时重新读取 resolver，强停／撤销后的新读取不保留旧预览；已经展示的字节无法撤回。
- 同题码短码不等于创建授权，官网不请求 `resolutionToken`，后续客户端开局仍须独立校验。

线上 nginx、AASA、旧 App、小程序落点和真实设备尚需部署后验收。没有执行部署。

2026-10-22 本地验证结果：`pnpm test` 5/5 用例通过，`pnpm build` 成功生成包含 `/pc/` 与原 `/s/` 的 11 个页面，`pnpm test:browser` 6/6 用例通过。`git diff --check` 通过；截图核对了 Android 安全转义与 Apple 引导。该结果不代表 nginx、AASA 缓存或尚未实现的客户端落点已完成验收。

2026-10-23 后端与Admin质量修复后回归：单元5/5、生产构建11页、浏览器6/6再次通过。后端已把Client／Admin／同题码分享URL收拢为共享规则，挑战保持`/pc/`；本次未修改官网业务代码，也未部署路由或关联声明。

2026-10-23 最终独立整体复审：本仓单元5/5、生产构建11页、浏览器6/6再次通过，未发现新的明确阻断；作者文字转义、受限App链接、Android／微信不唤起及恢复可见重核规则保持。本次没有修改官网业务代码或部署配置，统计页面仍后置。后端与Admin追加修复及最终回归见backend的 `docs/player-challenges/final-review-2026-10-23.md`；本机结果不替代线上nginx／AASA缓存或真实设备验收。
