# Starbook 公共页面字体

三家族自托管，首页与功能介绍、开始使用、帮助中心、更新日志（含专题和文章）复用独立 family 别名。法律、账号、分享和回顾等本轮范围外页面保持原有字体；不向 Google Fonts 发起运行时请求。

| 设计字体 | CSS family | 产物 |
| --- | --- | --- |
| Noto Serif SC 600 / 900 | `Starbook Noto Serif SC` | `public/fonts/starbook/noto-serif-sc-600.woff2`、`noto-serif-sc-900.woff2` |
| Cinzel 600 / 700 | `Starbook Cinzel` | `public/fonts/starbook/cinzel-600.woff2`、`cinzel-700.woff2` |
| Long Cang 400 | `Starbook Long Cang` | `public/fonts/starbook/long-cang-400.woff2` |

`scripts/subset-starbook-fonts.py` 同步生成 `src/styles/starbook-fonts.css` 中唯一的五个 `@font-face`，使用 `font-display: swap`，每个字体 URL 带该文件 SHA256 前 12 位的 `?v=`。首页和内容页只导入此定义，避免同名字体扩大字符集后命中旧子集缓存；不需要改服务器配置。正文和长篇文章仍使用系统字体栈。

## 来源与许可

官方 [Google Fonts 仓库](https://github.com/google/fonts) 固定 commit `cc39c4c2c304bc368c9b7c311ea2bcc6013299fe`：

- [Noto Serif SC](https://github.com/google/fonts/tree/cc39c4c2c304bc368c9b7c311ea2bcc6013299fe/ofl/notoserifsc)：原始变量字体版本 `2.003-H1`，仅取 600、900 静态实例。
- [Cinzel](https://github.com/google/fonts/tree/cc39c4c2c304bc368c9b7c311ea2bcc6013299fe/ofl/cinzel)：原始变量字体版本 `2.000`，仅取 600、700 静态实例。
- [Long Cang](https://github.com/google/fonts/tree/cc39c4c2c304bc368c9b7c311ea2bcc6013299fe/ofl/longcang)：原始常规字体版本 `2.001`。

三者都是 SIL Open Font License 1.1。原样许可证分别放在 `public/fonts/starbook/OFL-NotoSerifSC.txt`、`OFL-Cinzel.txt`、`OFL-LongCang.txt`；各自版权声明后均未指定 Reserved Font Name，保留源字体版权、许可证与 name 记录，不额外改内部家族名。CSS 别名仅用于限制样式作用域。

精确下载 URL、源文件与许可证 SHA256 固定在 `scripts/subset-starbook-fonts.py`，产物版本、体积、SHA256、字符集和版权记录在 `public/fonts/starbook/manifest.json`。完整原字体只缓存到被忽略的 `.tmp/starbook-fonts/sources/`，不提交完整 TTF。已经存在的原始 OFL 必须通过 hash，脚本不会重写它们。

## 重新生成

只在开发机的临时虚拟环境安装构建工具，网站部署与运行不需要 Python、FontTools 或远程字体：

```sh
python3 -m venv .tmp/starbook-fonts/venv
.tmp/starbook-fonts/venv/bin/python -m pip install 'fonttools==4.59.0' 'brotli==1.1.0'
.tmp/starbook-fonts/venv/bin/python scripts/subset-starbook-fonts.py --download
.tmp/starbook-fonts/venv/bin/python scripts/subset-starbook-fonts.py --check
```

首次 `--download` 从上述固定版本读取文件并校验 SHA256；缓存完整后不带此参数即可离线重建。`--check` 只读当前页面、字体产物与 manifest，不访问网络、不要求完整源字体。

子集使用 [FontTools subset](https://fonttools.readthedocs.io/en/latest/subset/index.html)（与 `pyftsubset` 相同引擎）和 [变量字体静态实例化](https://fonttools.readthedocs.io/en/latest/varLib/instancer.html)。脚本固定依赖版本、禁用时间戳重算，重复生成结果应一致。

## 字符覆盖与回退

字符来自首页、`starbook.ts`、全部 Starbook 组件、`StarbookLayout`、本轮四类页面和专题/指南模板，以及完整 `reference.dc.html` 的保守并集。模板内的动态空态、复制反馈、待办和切换说明都纳入。

`site.ts` 与 `feature-pages.ts` 只收集 `title`、`label`、`category`、`minutes`、`kind`、`version`、`date`、`scenario`、`example`、`access` 和 `guideCategories`；这包括文章标题、`section.title`、卡片分类和日期等实际字体文案，不把 `paragraphs`、`text` 等长正文纳入手写子集。保留可打印 ASCII 和 0–9，覆盖首页完成计数、搜索结果数、日期和版本变化。精确源路径与字段记录在 manifest；修改文字后重新生成并执行 `--check`。

- 两个 Noto 子集必须覆盖完整字符并集。
- Long Cang 覆盖所采集的全部中文和数字。原字体缺少的部分标点和箭头，由 Noto 提供，因此手写栈使用 `"Starbook Long Cang", "Starbook Noto Serif SC", cursive`。这属于原设计家族之间的自然回退，没有重绘或替换手写汉字；每次变更仍按实际 cmap 核验。
- Cinzel 用于 `ASTRIA`、`EORZEA`、`A WIDER SKY` 等拉丁字标，子集保留源字体支持的相关字符。

校验直接读取五个 WOFF2 的 cmap，检查当前中文、数字、拉丁字标、Noto 完整字符覆盖及产物/许可证 hash，同时核对生成 CSS 的版本 URL。它不把系统回退误称为 Long Cang 原生有箭头。视觉验证应等待 `document.fonts.ready`，并检查首页和内容页实际发出的字体请求含当前版本、所有标题/批注没有缺字；正文仍应计算为系统字体。

本次公共内容页扩展覆盖 706 个可打印字符，其中 590 个汉字；五个 WOFF2 总计 559,520 字节。具体单文件大小以 manifest 为准。
