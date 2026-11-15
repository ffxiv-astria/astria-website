# Starbook 首页字体

三家族按设计稿自托管，首页 CSS 使用独立 family 别名；不修改其他页面字体，不向 Google Fonts 发起运行时请求。

| 设计字体 | 首页 CSS family | 产物 |
| --- | --- | --- |
| Noto Serif SC 600 / 900 | `Starbook Noto Serif SC` | `public/fonts/starbook/noto-serif-sc-600.woff2`、`noto-serif-sc-900.woff2` |
| Cinzel 600 / 700 | `Starbook Cinzel` | `public/fonts/starbook/cinzel-600.woff2`、`cinzel-700.woff2` |
| Long Cang 400 | `Starbook Long Cang` | `public/fonts/starbook/long-cang-400.woff2` |

`@font-face` 由首页专属样式引用，使用 `font-display: swap`。正文仍为设计稿要求的系统字体栈。

## 来源与许可

官方 [Google Fonts 仓库](https://github.com/google/fonts) 固定 commit `cc39c4c2c304bc368c9b7c311ea2bcc6013299fe`：

- [Noto Serif SC](https://github.com/google/fonts/tree/cc39c4c2c304bc368c9b7c311ea2bcc6013299fe/ofl/notoserifsc)：原始变量字体版本 `2.003-H1`，仅取 600、900 静态实例。
- [Cinzel](https://github.com/google/fonts/tree/cc39c4c2c304bc368c9b7c311ea2bcc6013299fe/ofl/cinzel)：原始变量字体版本 `2.000`，仅取 600、700 静态实例。
- [Long Cang](https://github.com/google/fonts/tree/cc39c4c2c304bc368c9b7c311ea2bcc6013299fe/ofl/longcang)：原始常规字体版本 `2.001`。

三者都是 SIL Open Font License 1.1。原样许可证分别放在 `public/fonts/starbook/OFL-NotoSerifSC.txt`、`OFL-Cinzel.txt`、`OFL-LongCang.txt`；各自版权声明后均未指定 Reserved Font Name，保留源字体版权、许可证与 name 记录，不额外改内部家族名。CSS 别名仅用于限制样式作用域。

精确下载 URL、源文件与许可证 SHA256 固定在 `scripts/subset-starbook-fonts.py`，产物版本、体积、SHA256、字符集和版权记录在 `public/fonts/starbook/manifest.json`。完整原字体只缓存到被忽略的 `.tmp/starbook-fonts/sources/`，不提交完整 TTF。

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

字符来自 `src/pages/index.astro`、`src/data/starbook.ts`、`src/components/starbook/Polaroid.astro` 与完整 `reference.dc.html` 的保守并集，包含动态待办、所有切换说明、批注、参考稿原文和可打印 ASCII。保留 0–9，覆盖完成计数从 0 到 8 的变化；修改文字后重新生成并执行 `--check`。

- 两个 Noto 子集必须覆盖完整字符并集。
- Long Cang 覆盖首页与参考稿所有中文和数字。原字体不提供 `· ↑ → ↓ ↙`，Noto 原字体提供这些字形，因此手写栈使用 `"Starbook Long Cang", "Starbook Noto Serif SC", cursive`。这属于原设计家族之间的自然回退，没有重绘或替换手写汉字。
- Cinzel 用于 `ASTRIA`、`EORZEA`、`A WIDER SKY` 等拉丁字标，子集保留源字体支持的相关字符。

校验直接读取五个 WOFF2 的 cmap，检查当前中文、数字、拉丁字标、Noto 完整字符覆盖及产物/许可证 hash。它不把系统回退误称为 Long Cang 原生有箭头。

本次 review-1 稳定文案覆盖 479 个可打印字符，其中 368 个汉字；五个 WOFF2 总计 394,808 字节。具体单文件大小以 manifest 为准。
