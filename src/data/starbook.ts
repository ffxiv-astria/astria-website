import item from "../assets/screenshots/apple/starbook/item-amethyst.png";
import market from "../assets/screenshots/apple/starbook/market-hot.png";
import gatherer from "../assets/screenshots/apple/starbook/gatherer-clock.png";
import weather from "../assets/screenshots/apple/starbook/weather.png";
import party from "../assets/screenshots/apple/starbook/party-finder.png";
import housing from "../assets/screenshots/apple/starbook/housing.png";
import gearing from "../assets/screenshots/apple/starbook/gearing-square.png";
import cards from "../assets/screenshots/apple/starbook/triple-triad.png";
import blueMage from "../assets/screenshots/apple/starbook/blue-mage.png";
import fauxHollows from "../assets/screenshots/apple/starbook/faux-hollows.png";
import pvp from "../assets/screenshots/apple/starbook/pvp-rotation.png";

export const starbookTasks = [
  {
    text: "查一下这块材料从哪来",
    tool: "道具资料",
    image: item,
    body: "配方、材料、用途和掉落来源一页看完；相关的任务、副本和 NPC 也能接着点下去。",
  },
  {
    text: "卖之前，看看什么最热门",
    tool: "市场行情",
    image: market,
    body: "热度、成交量和涨跌榜，加上各服挂单、成交与走势；材料清单帮你算一次采购。",
  },
  {
    text: "赶在 ET 12:00 前守采集点",
    tool: "采集时钟",
    image: gatherer,
    body: "艾欧泽亚时间与限时采集窗口；App 可单独开启采集提醒，需允许系统通知。",
  },
  {
    text: "等一场小雨再出发",
    tool: "天气预报",
    image: weather,
    body: "各地区当前与未来的天气，按目标天气筛出合适的时段。",
  },
  {
    text: "今晚找一队打零式",
    tool: "跨服招募",
    image: party,
    body: "按副本与玩法筛选跨服招募，还能看到今天的招募速度。",
  },
  {
    text: "盯一块空地，别错过抽签",
    tool: "售楼中心",
    image: housing,
    body: "查看空地、抽签阶段与价格；登录后可按条件订阅，在消息中心查看匹配变化。",
  },
  {
    text: "给新职业配一套装",
    tool: "Asvel 配装器",
    image: gearing,
    body: "逛配装广场找现成方案，导入、整理并分享自己的配装。",
  },
  {
    text: "补齐还缺的九宫幻卡",
    tool: "九宫幻卡",
    image: cards,
    body: "卡牌图鉴、收集目标和缺失清单，知道下一张该去哪拿。",
  },
];

export const starbookExtras = [
  {
    image: blueMage,
    alt: "天穹 App 青魔法书界面示例",
    caption: "青魔法学到哪了",
    rotation: -3,
    tape: "gold",
  },
  {
    image: fauxHollows,
    alt: "天穹 App 幻巧拼图界面示例",
    caption: "幻巧拼图，帮你算",
    rotation: 2,
    tape: "blue",
  },
  {
    image: pvp,
    alt: "天穹 App PvP 地图轮换界面示例",
    caption: "今晚打哪张图",
    rotation: -1,
    tape: "gold",
  },
] as const;

// Match the approved reference: generate once at build time with seed 11.
export function starbookSky() {
  let seed = 11;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: 110 }, () => ({
    x: (random() * 100).toFixed(2),
    y: (random() * 100).toFixed(2),
    size: random() < 0.85 ? 1 : 2,
    opacity: (0.2 + random() * 0.6).toFixed(2),
  }));
}
