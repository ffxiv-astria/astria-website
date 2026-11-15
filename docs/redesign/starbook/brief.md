# 首页改版：星空手账（Starbook）

交给实现方的完整说明。设计稿由 Claude 在画布里画好、用户已选定方向；本文件和同目录的 `reference.dc.html` 是唯一的设计依据。实现完成后由 Claude 验收。

## 1. 范围

- 本轮只重做首页 `/`（`src/pages/index.astro`）。顶部导航与页脚如果要换成新样式，必须保证其余页面（功能、指南、更新、法律、注销、分享承接、回顾）照常可用、不变形；做不到就只在首页用新的导航和页脚。
- 保留 `#download`、`#features` 两个锚点（分享承接页会链接它们）。新稿里「能做什么」一节用 `id="features"`，下载卡片用 `id="download"`。
- 不做其他页面，不改业务页（`/s/`、`/pc/`、`/recap/`、`/bind/`、`/account-deletion`）。

## 2. 硬性约束

- 遵守 `docs/website-content.md` 与 `docs/homepage-assets.md`：
  - 只写已正式分发且开放的能力；不虚构版本、日期、下载量、评价。
  - App Store 只用官方黑色徽章 `public/brand/download-on-the-app-store-zh-cn.svg`，高 50px、四周留白 12.5px，不改色不变形。
  - 小程序码 `public/brand/wechat-miniapp-code.jpg` 原样使用，不裁不重绘。
  - 首页不放玩家挑战、年度回顾、TestFlight、Android 下载链接。
- **核实两项后再上**：幻巧拼图、宏方案库在 Apple 1.1.0 正式版里是否已开放。查不实就从首页拿掉（宏方案库只出现在便签里，幻巧拼图是「夹着的几页」里的一张照片，拿掉后换成别的已确认功能或只留两张）。
- **字体不能运行时加载 Google Fonts**（国内访问不到）。用到三款开源字体（均为 SIL OFL）：
  - 思源宋体 Noto Serif SC 600 / 900：标题；
  - Cinzel 600 / 700：拉丁小标与 ASTRIA 字标；
  - 龙藏体 Long Cang：手写批注。
  自托管 woff2，并按首页实际用到的字符做子集（可写一个脚本从首页文案收集字符，用 fonttools `pyftsubset` 生成，产物提交进仓库；脚本放 `scripts/`）。正文用系统字体栈 `-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Noto Sans SC', sans-serif`。字体许可证文本放到 `public/fonts/` 或在「法律与数据来源」页补一行，二选一，说明即可。
- 不发布、不部署：不要运行 `pnpm build:sh`，不要 push。
- 在新分支 `redesign/starbook-home`（从 `main` 切出）上工作，可以本地提交。

## 3. 设计语言

| Token | 值 | 用途 |
|---|---|---|
| void | `#070A1F` | 页面底色 |
| deep | `#0D1240` | 笔记本页、下载卡底 |
| line | `#262C5C` / `#1F2560` | 分隔线、笔记本横线 |
| dot | `#1A2052` | 全页点阵（`radial-gradient` 1px，间距 24px） |
| star | `#E9ECFF` | 主文字 |
| soft | `#B9C0E6` | 正文次要 |
| muted | `#9AA3D6` | 说明、页脚 |
| gold | `#E8C77A` | 强调、胶带、图钉、便签、按钮 |
| blue | `#8DA8FF` | 第二批注色、胶带 |
| paper | `#F4EFE3` | 拍立得相纸、iPad 相框 |
| ink | `#1A1430` | 相纸与便签上的文字 |

- 首屏另有随机星点（约 110 个 1–2px 圆点，透明度 0.2–0.8，用固定种子生成，构建时就定下来，不要每次加载变化）。
- 拍立得：相纸 `paper` 底，四周约 3% 内边距、底部留白写手写标题，带阴影，轻微旋转（−6°～+4°）。顶部压一条半透明胶带（金或蓝），或一颗金色四角星图钉（星形 path 见参考稿，和 App 图标里的星一致）。
- 中文标题不要负字距（参考稿 letter-spacing 是 0.02em）。
- 详细尺寸、间距、旋转角度、字号都以 `reference.dc.html` 里的 inline style 为准。

## 4. 页面结构与文案

文案以参考稿为准，这里只列结构。

1. **页头**：图标（轻微旋转）+ `ASTRIA`（Cinzel）+ `天穹`（宋体）；导航：能做什么 / iPad / 使用指南 / 更新日志；金色「下载 App」按钮（旋转 −2°）。使用指南、更新日志链到现有 `/guides/`、`/updates/`。
2. **首屏**：
   - 左：金色描边手写标签「1.1.0 新到：萌新招待 · 陆行鸟礼物站 · 水晶冲突排行榜 →」链到 `/updates/`；标题「冒险者的 / 随身星图」，「随身星图」下有金色荧光笔底；说明一段；App Store 徽章 + 蓝色手写「没有 iPhone？微信搜「FF14检索工具」」。
   - 右：三张拍立得拼贴（道具资料紫水晶 / 市场热度榜 / 采集时钟），之间一条金色虚线三角连起图钉位置，两条手写批注，一枚金色圆章「天穹 EORZEA」。
3. **今天上线前**（`id="features"`）：
   - 左：深蓝笔记本页，横线 + 金色页边线；标题「今天上线前」和手写计数「已完成 n / 8」；八条待办，每条 = 原生复选框（`accent-color: gold`）+ 手写文字 + 金色描边标签按钮「→ 功能名」。
   - 右：一张钉住的拍立得，显示当前选中标签对应的截图，下面一行说明，再下一行蓝色手写提示「点左边的标签，换一张钉上来」。
4. **本子里还夹着几页**：三张小拍立得（青魔法书 / 幻巧拼图 / PvP 轮换）+ 金色便签「还有这些：零式英雄榜与角色战绩、云雾街玩家社区、宏方案库」，虚线下方一句「App 里还能连上石之家：幻化、攻略、招募板与官方活动。需要绑定叨鱼账号。」
5. **iPad**（`id="ipad"`）：小标 `A WIDER SKY`、标题「在大桌面上摊开」、蓝色手写一行，下面相纸框住的 iPad 配装截图（`src/assets/screenshots/apple/ipad-gearing.png`，裁掉底部），左右两条斜胶带，整体旋转 −1.2°；脚注一行 Mac 兼容说明。
6. **下载**（`id="download"`）：金色虚线框的「剪下来」卡片，左上剪刀图标；左「带上天穹，/ 去冒险。」+ 金色手写「两个入口，挑顺手的那个」；右两个入口块：App Store 徽章（iPhone 与 iPad）、小程序码（96px）+「FF14检索工具 / 扫码，或在微信里搜索」。下面页脚一行声明 + 法律链接（隐私政策、服务协议、账号注销、法律与数据来源，链到现有页面）。

## 5. 交互

- 待办复选框：纯本页状态，勾上后文字划线变灰，计数更新。初始第一条已勾选。不需要持久化（要做的话只能用 localStorage 且包 try/catch）。
- 标签按钮：点击后右侧拍立得换成对应截图和说明，按钮变实心金色，`aria-pressed` 同步。初始选中第一条。
- 无 JS 时：复选框可用、右侧显示第一张，页面完整可读。
- 键盘可达，焦点样式清楚（金色 outline）。所有图片有中文 alt；装饰元素 `aria-hidden`。
- `prefers-reduced-motion` 下不要有任何动画（本稿本来就不需要动画，可选的 hover 轻微回正旋转也要关掉）。

## 6. 待办与截图对应

| 待办 | 标签 | 截图 | 说明 |
|---|---|---|---|
| 查一下这块材料从哪来 | 道具资料 | `item-amethyst.png` | 配方、材料、用途和掉落来源一页看完；相关的任务、副本和 NPC 也能接着点下去。 |
| 卖之前，看看什么最热门 | 市场行情 | `market-hot.png` | 热度、成交量和涨跌榜，加上各服挂单、成交与走势；材料清单帮你算一次采购。 |
| 赶在 ET 12:00 前守采集点 | 采集时钟 | `gatherer-clock.png` | 艾欧泽亚时间和正在开放的限时采集点；关注的采集物，到点前提醒你。 |
| 等一场小雨再出发 | 天气预报 | `weather.png` | 各地区当前与未来的天气，按目标天气筛出合适的时段。 |
| 今晚找一队打零式 | 跨服招募 | `party-finder.png` | 按副本与玩法筛选跨服招募，还能看到今天的招募速度。 |
| 盯一块空地，别错过抽签 | 售楼中心 | `housing.png` | 空地、抽签阶段与价格一目了然；订阅想要的房区，有变化就知道。 |
| 给新职业配一套装 | Asvel 配装器 | `gearing-square.png` | 逛配装广场找现成方案，导入、整理并分享自己的配装。 |
| 补齐还缺的九宫幻卡 | 九宫幻卡 | `triple-triad.png` | 卡牌图鉴、收集目标和缺失清单，知道下一张该去哪拿。 |

「采集时钟」「天气预报」「售楼中心」的提醒/订阅说法请对照 iOS 与小程序实际能力核实措辞（例如提醒是否需要登录、是否仅 App），不准确就改得保守些。

## 7. 素材

截图都在 `src/assets/screenshots/apple/starbook/`，用 Astro `Image` 输出 WebP 与响应式尺寸。

- 来源：2026-11-16 当前开发构建在 iPhone 17 Pro Max 模拟器的 Mock 模式截图（`-AstriaMockMode passthrough`，招募、配装广场等玩家列表是 `MockRoutes.showcase` 的编造演示数据），只裁掉了状态栏，未改内容。`item-amethyst.png` 是 1.0.0 App Store 展示图裁出的界面部分（去掉了图上的宣传标题）。
- `housing.png` 的「3410 处」等数字是截图时的线上实时数据，页面上要有一行「界面示例；数据以实际客户端为准」之类的说明（现首页已有类似一句，可沿用）。
- 把这些来源写进 `docs/homepage-assets.md`（新增一节），旧的 `src/assets/home/` 三张如果不再使用就删掉并更新文档。

参考稿里的 `/_blob/<id>` 对应：

| blob id | 文件 |
|---|---|
| `ea1ba4af…` | `public/brand/astria-app-icon.png`（页头图标） |
| `2c70c525…` | `public/brand/download-on-the-app-store-zh-cn.svg` |
| `6f0f5382…` | `public/brand/wechat-miniapp-code.jpg` |
| `ee305f48…` | `starbook/item-amethyst.png` |
| `4ea1cf0d…` | `starbook/market-hot.png` |
| `99396b60…` | `starbook/gatherer-clock.png` |
| `14553ca7…` | `starbook/weather.png` |
| `946bc539…` | `starbook/party-finder.png` |
| `76e211ad…` | `starbook/housing.png` |
| `5a730c82…` | `starbook/gearing-square.png` |
| `0edd3709…` | `starbook/triple-triad.png` |
| `a49d1a34…` | `starbook/blue-mage.png` |
| `1f55b742…` | `starbook/faux-hollows.png` |
| `fcd27916…` | `starbook/pvp-rotation.png` |
| `9d41340d…` | `src/assets/screenshots/apple/ipad-gearing.png` |

## 8. 关于参考稿 `reference.dc.html`

它是设计画布的组件格式，不能直接在浏览器里跑：`{{x}}` 是模板变量，`<sc-for>`/`<sc-if>` 是循环和条件，`<helmet>` 是 head 片段，底部 `class Component` 里的 `renderVals()` 是数据和交互逻辑。照它的结构、inline style 和文案用 Astro 组件 + 少量原生 JS 重写即可，不要引入框架。参考稿用 `cqi` 容器单位做响应式，实现时可以换成媒体查询或 `clamp()` + `vw`。

## 9. 响应式

- 1440：两栏布局如参考稿。
- 834（iPad 竖屏）：首屏可以上下排；笔记本页与右侧照片可以上下排，照片放在笔记本下方居中。
- 390：拼贴区三张照片缩小后仍然可读，批注不能压住照片里的关键内容；如果挤，就只保留一条批注、圆章缩小。待办标签换行到文字下方。不能出现横向滚动。

## 10. 完成标准与回报

完成后在本地跑并全部通过：`pnpm test`、`pnpm test:browser`、`pnpm build`、`pnpm check:seo`、`git diff --check`。把 1440 / 834 / 390 三个宽度的首页整页截图存到 `.tmp/qa/starbook/`（已被忽略）。

然后回报：

1. 改了哪些文件（一句话说明每个）；
2. 上面每条命令的结果；
3. 截图路径；
4. 第 2 节两项核实的结论和依据；
5. 与设计稿不一致的地方及原因、还没做的事。

遇到需要决定的事（比如导航和页脚是否全站替换），先在对话里问，别自己定。
