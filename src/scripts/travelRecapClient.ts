import { toPng } from 'html-to-image';
import QRCode from 'qrcode';

const SCHEMA_VERSION = 1;
const allowedTones = new Set(['teal', 'gold', 'rose', 'green', 'violet']);
const allowedEmptyBehaviors = new Set(['hide', 'show-empty', 'show-muted']);
const allowedShareVariants = new Set(['standard', 'chocobo-rush', 'zero-page', 'gatekeeper', 'quiet-window']);
const hiddenSlideIds = new Set(['data-coverage', 'debug-check']);
const hiddenSlideKinds = new Set(['data-coverage', 'debug-check']);
const internalCopyPattern =
	/(全部历史|全部缓存|缓存|不受.*限制|365\s*天.*窗口|窗口限制|默认不上传|订单号|账号 ID|SNDA|App 注入|schema|调试|自检|isFullHistorySynced|最近同步|等待同步|同步确认|回溯完整|数据格式|开发)/i;
const root = document.querySelector<HTMLElement>('.recap-app');
const demoScript = document.querySelector<HTMLScriptElement>('#astria-recap-demo-payload');

type RuntimePayload = Record<string, any>;

if (!root || !demoScript?.textContent) {
	throw new Error('Astria recap runtime target is missing.');
}

const demoPayload = JSON.parse(demoScript.textContent);
const isEmbed = root.dataset.embed === 'true';
const apiBase = (import.meta.env.PUBLIC_API_BASE_URL || 'https://ff14search.cxmeow.top/api').replace(/\/$/, '');
/** 分享卡二维码的短链：落到 App 的旅行簿入口（feature/daoyuTravel），不含任何个人数据。 */
let shareQrDataUrl: Promise<string | null> | null = null;
const state: { index: number; payload: RuntimePayload | null; started: boolean; pendingStartIndex: number } = {
	index: 0,
	payload: null,
	started: false,
	pendingStartIndex: 0,
};

const nodes = {
	empty: document.querySelector<HTMLElement>('[data-empty-state]'),
	emptyTitle: document.querySelector<HTMLElement>('[data-empty-title]'),
	emptyBody: document.querySelector<HTMLElement>('[data-empty-body]'),
	emptyAction: document.querySelector<HTMLButtonElement>('[data-empty-action]'),
	start: document.querySelector<HTMLElement>('[data-start-state]'),
	startBrand: document.querySelector<HTMLElement>('[data-start-brand]'),
	startYear: document.querySelector<HTMLElement>('[data-start-year]'),
	startTitle: document.querySelector<HTMLElement>('[data-start-title]'),
	startCopy: document.querySelector<HTMLElement>('[data-start-copy]'),
	startButton: document.querySelector<HTMLButtonElement>('[data-start-recap]'),
	stage: document.querySelector<HTMLElement>('[data-recap-stage]'),
	slideShell: document.querySelector<HTMLElement>('[data-slide-shell]'),
	timeline: document.querySelector<HTMLElement>('[data-timeline]'),
	brand: document.querySelector<HTMLElement>('[data-brand]'),
	year: document.querySelector<HTMLElement>('[data-year]'),
	title: document.querySelector<HTMLElement>('[data-title]'),
	range: document.querySelector<HTMLElement>('[data-range]'),
	currentBody: document.querySelector<HTMLElement>('[data-current-body]'),
	privacyNote: document.querySelector<HTMLElement>('[data-privacy-note]'),
	kicker: document.querySelector<HTMLElement>('[data-slide-kicker]'),
	index: document.querySelector<HTMLElement>('[data-slide-index]'),
	slideTitle: document.querySelector<HTMLElement>('[data-slide-title]'),
	titleBarrageLayer: document.querySelector<HTMLElement>('[data-title-barrage-layer]'),
	metrics: document.querySelector<HTMLElement>('[data-metrics]'),
	footnote: document.querySelector<HTMLElement>('[data-footnote]'),
	tabs: document.querySelector<HTMLElement>('[data-slide-tabs]'),
	next: document.querySelector<HTMLButtonElement>('[data-next-slide]'),
	finalActions: document.querySelector<HTMLElement>('[data-final-actions]'),
	backCover: document.querySelector<HTMLButtonElement>('[data-back-cover]'),
	closeRecap: document.querySelector<HTMLButtonElement>('[data-close-recap]'),
	shareButton: document.querySelector<HTMLButtonElement>('[data-share-card]'),
	sharePanel: document.querySelector<HTMLElement>('[data-share-panel]'),
	shareBrand: document.querySelector<HTMLElement>('[data-share-brand]'),
	shareYear: document.querySelector<HTMLElement>('[data-share-year]'),
	shareTitle: document.querySelector<HTMLElement>('[data-share-title]'),
	shareRange: document.querySelector<HTMLElement>('[data-share-range]'),
	shareCopy: document.querySelector<HTMLElement>('[data-share-copy]'),
	shareHighlights: document.querySelector<HTMLElement>('[data-share-highlights]'),
	generateShare: document.querySelector<HTMLButtonElement>('[data-generate-share]'),
	closeShare: document.querySelector<HTMLButtonElement>('[data-close-share]'),
	shareStatus: document.querySelector<HTMLElement>('[data-share-status]'),
	shareCanvas: document.querySelector<HTMLElement>('[data-share-card-canvas]'),
	shareQr: document.querySelector<HTMLElement>('[data-share-qr]'),
	shareQrImage: document.querySelector<HTMLImageElement>('[data-share-qr-image]'),
};

function emitBridge(type: string, payload: RuntimePayload = {}) {
	const message = {
		type,
		payload,
		schemaVersion: SCHEMA_VERSION,
		timestamp: new Date().toISOString(),
	};
	window.dispatchEvent(new CustomEvent('astria:recap-event', { detail: message }));
	window.webkit?.messageHandlers?.astriaRecap?.postMessage(message);
}

function isRecord(value: unknown): value is RuntimePayload {
	return value != null && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, fallback = '') {
	return typeof value === 'string' && value.trim() ? value : fallback;
}

function displayText(value: unknown, fallback = '') {
	const content = text(value, fallback);
	return internalCopyPattern.test(content) ? '' : content;
}

function number(value: unknown, fallback = 0) {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalBoolean(value: unknown, fallback = true) {
	return typeof value === 'boolean' ? value : fallback;
}

function normalizeMetric(metric: unknown) {
	if (!isRecord(metric)) return null;
	return {
		label: text(metric.label),
		value: text(metric.value),
		note: text(metric.note),
		tone: allowedTones.has(metric.tone) ? metric.tone : 'teal',
	};
}

function normalizeSlide(slide: unknown, index: number) {
	if (!isRecord(slide)) return null;
	const metrics = Array.isArray(slide.metrics)
		? slide.metrics.map(normalizeMetric).filter(Boolean).slice(0, 4)
		: [];
	if (!text(slide.title) || !text(slide.kicker) || !text(slide.body) || metrics.length === 0) {
		return null;
	}
	return {
		id: text(slide.id, `slide-${index + 1}`),
		kind: text(slide.kind, 'overview'),
		kicker: text(slide.kicker),
		title: text(slide.title),
		body: text(slide.body),
		metrics,
		footnote: text(slide.footnote),
		chartLabels: Array.isArray(slide.chartLabels) ? slide.chartLabels.map((item) => text(item)).filter(Boolean) : [],
		chartValues: Array.isArray(slide.chartValues) ? slide.chartValues.map((item) => number(item)).filter((item) => item >= 0) : [],
		tags: Array.isArray(slide.tags) ? slide.tags.map((tag) => text(tag)).filter(Boolean) : [],
		optional: optionalBoolean(slide.optional),
		priority: number(slide.priority, 1000 + index),
		triggerReason: text(slide.triggerReason),
		emptyBehavior: allowedEmptyBehaviors.has(slide.emptyBehavior) ? slide.emptyBehavior : 'hide',
		originalIndex: index,
	};
}

function normalizeSlides(candidate: RuntimePayload) {
	const slides = Array.isArray(candidate.slides)
		? candidate.slides.map(normalizeSlide).filter(Boolean)
		: [];
	return slides
		.filter((slide: RuntimePayload) => !hiddenSlideIds.has(slide.id) && !hiddenSlideKinds.has(slide.kind))
		.sort((left: RuntimePayload, right: RuntimePayload) => {
		if (left.priority === right.priority) return left.originalIndex - right.originalIndex;
		return left.priority - right.priority;
	});
}

function minimalPayload(payload: RuntimePayload) {
	return {
		...payload,
		shareCard: {
			...payload.shareCard,
			variant: payload.shareCard?.variant || 'standard',
		},
		slides: Array.isArray(payload.slides)
			? payload.slides.filter((slide: RuntimePayload) => slide.optional === false)
			: [],
	};
}

function validatePayload(candidate: unknown): { payload?: RuntimePayload; error?: string } {
	if (!isRecord(candidate)) return { error: 'payload-not-object' };
	if (candidate.schemaVersion !== SCHEMA_VERSION) return { error: 'schema-version-mismatch' };
	const slides = normalizeSlides(candidate);
	if (slides.length === 0) return { error: 'slides-empty' };

	const summary = isRecord(candidate.summary) ? candidate.summary : {};
	const shareCard = isRecord(candidate.shareCard) ? candidate.shareCard : {};
	const emptyState = isRecord(candidate.emptyState) ? candidate.emptyState : {};

	return {
		payload: {
			schemaVersion: SCHEMA_VERSION,
			source: candidate.source === 'app' ? 'app' : 'demo',
			brand: text(candidate.brand, 'Astria天穹'),
			year: text(candidate.year, new Date().getFullYear().toString()),
			rangeText: text(candidate.rangeText, '过去 365 天'),
			lastSyncedAt: text(candidate.lastSyncedAt, '等待同步'),
			isFullHistorySynced: candidate.isFullHistorySynced === true,
			title: text(candidate.title, '过去 365 天的超域旅行回顾'),
			privacyNote: '',
			summary: {
				successfulDepartures: number(summary.successfulDepartures),
				activeReturns: number(summary.activeReturns),
				autoReturns: number(summary.autoReturns),
				stillAway: number(summary.stillAway),
				activeDays: number(summary.activeDays),
				characterCount: number(summary.characterCount),
				precheckFailures: number(summary.precheckFailures),
				topDestination: text(summary.topDestination, '未统计'),
				topRoute: text(summary.topRoute, '未统计'),
				chocoboRushHits: number(summary.chocoboRushHits),
				longestQuietDays: number(summary.longestQuietDays),
				annualTitle: text(summary.annualTitle, text(shareCard.title, '旅行簿')),
			},
			shareCard: {
				title: text(shareCard.title, text(summary.annualTitle, '旅行簿')),
				copy: text(shareCard.copy, '这一年的超域旅行故事，已经写进 Astria天穹。'),
				highlights: Array.isArray(shareCard.highlights)
					? shareCard.highlights.map((item) => text(item)).filter(Boolean).slice(0, 6)
					: [],
				variant: allowedShareVariants.has(shareCard.variant) ? shareCard.variant : 'standard',
			},
			emptyState: {
				title: text(emptyState.title, '今年还没有超域旅行记录'),
				body: text(emptyState.body, '旅行簿还没翻开，水晶正在路上。'),
				actionLabel: text(emptyState.actionLabel, '稍后再看'),
			},
			slides,
		},
	};
}

function setHidden(element: HTMLElement | null, hidden: boolean) {
	if (element) element.hidden = hidden;
}

function setText(element: HTMLElement | null, value: string) {
	if (element) element.textContent = value;
}

function isHeroMetric(metric: RuntimePayload) {
	return /\d/.test(metric.value) && metric.value.length <= 8;
}

function metricNumber(metric: RuntimePayload) {
	const matched = String(metric.value || '').match(/\d+(?:\.\d+)?/);
	return matched ? Number(matched[0]) : 0;
}

function slideMetricMode(slide: RuntimePayload) {
	if (slide.kind === 'title-wall') return 'title-wall-board';
	if (['cover', 'destination', 'chocobo-rush', 'quiet-window', 'official-gatekeeper'].includes(slide.kind)) return 'poster-board';
	if (['time', 'late-night'].includes(slide.kind)) return 'histogram-board';
	if (slide.id === 'area-map' || ['area-map'].includes(slide.kind)) return 'donut-board';
	if (['route-map'].includes(slide.kind)) return 'route-board';
	if (['return', 'stay', 'current-status'].includes(slide.kind)) return 'ledger-board';
	if (['comparison', 'official-hints', 'button-habit', 'deport-detail', 'retry'].includes(slide.kind)) return 'bar-board';
	const heroKinds = new Set(['cover', 'overview', 'first-aether', 'last-aether']);
	if (heroKinds.has(slide.kind) && slide.metrics?.some((metric: RuntimePayload, index: number) => index === 0 && isHeroMetric(metric))) return 'hero-board';
	return 'title-board';
}

function chartValues(slide: RuntimePayload) {
	if (Array.isArray(slide.chartValues) && slide.chartValues.length > 0) return slide.chartValues;
	if (slide.kind === 'time') return [2, 1, 1, 2, 5, 7, 6, 9, 3, 4, 4, 5];
	if (slide.kind === 'late-night') return [8, 5, 2, 1, 0, 0, 1, 2, 4, 5, 6, 7, 8, 6, 7, 8, 9, 11, 13, 12, 16, 14, 15, 20];
	if (slide.kind === 'comparison') return [12, 18, 6];
	return slide.metrics.map(metricNumber);
}

function chartLabels(slide: RuntimePayload, values: number[]) {
	if (Array.isArray(slide.chartLabels) && slide.chartLabels.length === values.length) return slide.chartLabels;
	if (slide.kind === 'late-night') return values.map((_: number, index: number) => String(index));
	if (slide.kind === 'time') return values.map((_: number, index: number) => String(index + 1));
	return values.map((_: number, index: number) => String(index + 1));
}

function visualElement(slide: RuntimePayload) {
	const mode = slideMetricMode(slide);
	const visual = document.createElement('div');
	visual.className = `metric-visual ${mode}`;

	if (mode === 'histogram-board') {
		const values = chartValues(slide);
		const labels = chartLabels(slide, values);
		const max = Math.max(...values, 1);
		const bars = document.createElement('div');
		bars.className = 'histogram';
		values.forEach((value, index) => {
			const bar = document.createElement('span');
			bar.style.setProperty('--h', `${Math.max(8, Math.round((value / max) * 100))}%`);
			bar.style.setProperty('--i', String(index));
			bar.className = value === max ? 'peak' : '';
			bar.dataset.label = labels[index] || String(index + 1);
			bars.append(bar);
		});
		const caption = document.createElement('p');
		caption.textContent =
			slide.kind === 'late-night'
				? `其中 ${slide.metrics[1]?.value || '不少'} 在深夜与凌晨出发`
				: `${slide.metrics[1]?.value || '某个月'}，是你最爱出门的月份`;
		visual.append(bars, caption);
		return visual;
	}

	if (mode === 'donut-board') {
		const primary = slide.metrics[1] || slide.metrics[0];
		const values = chartValues(slide);
		const total = Math.max(values.reduce((sum: number, value: number) => sum + value, 0), 1);
		const primaryValue = Math.max(values[0] || metricNumber(slide.metrics[0] || {}), 0);
		const percent = Math.max(8, Math.min(100, Math.round((primaryValue / total) * 100)));
		const ring = document.createElement('div');
		ring.className = 'donut-ring';
		ring.style.setProperty('--donut', `${percent}%`);
		const center = document.createElement('strong');
		center.textContent = slide.metrics[0]?.value || '1';
		const label = document.createElement('span');
		label.textContent = slide.metrics[0]?.label || '旅行版图';
		ring.append(center, label);
		const legend = document.createElement('p');
		legend.textContent = `${primary?.value || '陆行鸟'} 是今年最常出现的颜色`;
		visual.append(ring, legend);
		return visual;
	}

	if (mode === 'route-board') {
		const route = document.createElement('div');
		route.className = 'route-visual';
		const from = document.createElement('strong');
		from.textContent = slide.metrics[0]?.value?.split('->')[0]?.trim() || slide.metrics[2]?.value || '出发地';
		const to = document.createElement('strong');
		to.textContent = slide.metrics[0]?.value?.split('->')[1]?.trim() || slide.metrics[1]?.value || '目的地';
		const line = document.createElement('span');
		route.append(from, line, to);
		const caption = document.createElement('p');
		caption.textContent = slide.metrics[0]?.note || '这条路今年熟得有点过分';
		visual.append(route, caption);
		return visual;
	}

	if (mode === 'ledger-board') {
		const ledger = document.createElement('div');
		ledger.className = 'ledger-visual';
		slide.metrics.slice(0, 4).forEach((metric: RuntimePayload) => {
			const item = document.createElement('span');
			item.innerHTML = `<b>${metric.value}</b><small>${metric.label}</small>`;
			ledger.append(item);
		});
		visual.append(ledger);
		return visual;
	}

	if (mode === 'poster-board') {
		const metric = slide.metrics[0];
		const poster = document.createElement('div');
		poster.className = 'poster-number';
		const value = document.createElement('strong');
		value.textContent = metric?.value || '';
		const label = document.createElement('span');
		label.textContent = metric?.label || '';
		poster.append(value, label);
		visual.append(poster);
		return visual;
	}

	return null;
}

function titleWallLabels(slide: RuntimePayload) {
	return (Array.isArray(slide.chartLabels) && slide.chartLabels.length > 0 ? slide.chartLabels : slide.metrics.map((metric: RuntimePayload) => metric.value))
		.map((item: unknown) => text(item))
		.filter(Boolean);
}

function renderTitleBarrage(slide: RuntimePayload) {
	if (!nodes.titleBarrageLayer) return;
	const enabled = slide.kind === 'title-wall';
	setHidden(nodes.titleBarrageLayer, !enabled);
	nodes.titleBarrageLayer.replaceChildren();
	if (!enabled) return;
	const pool = titleWallLabels(slide);
	const titles = pool.length > 0 ? pool : ['年度称号'];
	const anchors = [
		[12, 10, 1.28, 0.04, -10],
		[76, 12, 0.92, 0.05, 8],
		[24, 22, 0.72, 0.045, -5],
		[86, 28, 1.18, 0.038, 12],
		[9, 42, 0.84, 0.04, 6],
		[89, 48, 0.78, 0.045, -8],
		[17, 66, 1.08, 0.04, -12],
		[78, 68, 0.88, 0.045, 7],
		[34, 82, 0.7, 0.05, 4],
		[68, 88, 1.22, 0.035, -6],
		[6, 88, 0.92, 0.038, 9],
		[94, 78, 0.68, 0.045, -4],
	];
	const items = anchors.map(([x, y, scale, opacity, rotate], index) => {
		const item = document.createElement('span');
		item.textContent = titles[index % titles.length];
		item.style.setProperty('--x', `${x}%`);
		item.style.setProperty('--y', `${y}%`);
		item.style.setProperty('--s', String(scale));
		item.style.setProperty('--o', String(opacity));
		item.style.setProperty('--r', `${rotate}deg`);
		item.style.setProperty('--delay', `${(index % 8) * 70}ms`);
		return item;
	});
	nodes.titleBarrageLayer.replaceChildren(...items);
}

function metricElement(metric: RuntimePayload, index: number, maxValue = 0) {
	const card = document.createElement('div');
	const currentSlide = state.payload?.slides?.[state.index];
	card.className = `metric ${metric.tone || 'teal'} ${slideMetricMode(currentSlide || {}) === 'hero-board' && index === 0 && isHeroMetric(metric) ? 'hero-metric' : ''}`;
	const percent = maxValue > 0 ? Math.max(12, Math.min(100, Math.round((metricNumber(metric) / maxValue) * 100))) : 0;
	if (percent) card.style.setProperty('--bar', `${percent}%`);
	const value = document.createElement('strong');
	value.textContent = metric.value;
	const label = document.createElement('span');
	label.textContent = metric.label;
	const note = document.createElement('small');
	note.textContent = metric.note;
	card.append(value, label, note);
	return card;
}

function renderMetrics(slide: RuntimePayload) {
	const metrics = slide.metrics || [];
	const mode = slideMetricMode(slide);
	const maxValue = Math.max(...metrics.map(metricNumber), 0);
	nodes.metrics?.classList.remove(
		'hero-board',
		'title-board',
		'bar-board',
		'poster-board',
		'histogram-board',
		'donut-board',
		'route-board',
		'ledger-board',
		'title-wall-board',
	);
	nodes.metrics?.classList.add(mode);
	const visual = visualElement(slide);
	const visibleMetrics =
		mode === 'poster-board' || mode === 'donut-board'
			? metrics.slice(1)
			: mode === 'ledger-board'
				? []
				: metrics;
	const metricCards = visibleMetrics.map((metric: RuntimePayload, index: number) => metricElement(metric, index, maxValue));
	nodes.metrics?.replaceChildren(...(visual ? [visual, ...metricCards] : metricCards));
}

function renderTabs(payload: RuntimePayload) {
	const buttons = payload.slides.map((slide: RuntimePayload, index: number) => {
		const button = document.createElement('button');
		button.type = 'button';
		button.dataset.slideTab = String(index);
		if (index === state.index) button.classList.add('active');
		const count = document.createElement('span');
		count.textContent = String(index + 1).padStart(2, '0');
		button.append(count, document.createTextNode(slide.kicker));
		return button;
	});
	nodes.tabs?.replaceChildren(...buttons);
}

/**
 * 签发旅行簿入口的短链并画成二维码。只签一次；网络失败时返回 null，
 * 分享图照常生成，只是不带二维码。
 */
function loadShareQr(): Promise<string | null> {
	shareQrDataUrl ??= (async () => {
		try {
			const response = await fetch(`${apiBase}/share/links`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				body: JSON.stringify({ targetType: 'feature', targetId: 'daoyuTravel' }),
			});
			if (!response.ok) return null;
			const link = (await response.json()) as { url?: string };
			if (!link.url) return null;
			return await QRCode.toDataURL(link.url, { margin: 1, width: 228, errorCorrectionLevel: 'M' });
		} catch {
			return null;
		}
	})();
	return shareQrDataUrl;
}

async function showShareQr() {
	const dataUrl = await loadShareQr();
	if (!dataUrl || !nodes.shareQrImage) return;
	if (nodes.shareQrImage.src !== dataUrl) {
		nodes.shareQrImage.src = dataUrl;
		await nodes.shareQrImage.decode().catch(() => undefined);
	}
	setHidden(nodes.shareQr, false);
}

function renderShare(payload: RuntimePayload) {
	setText(nodes.shareBrand, payload.brand);
	setText(nodes.shareYear, payload.year);
	setText(nodes.shareTitle, payload.shareCard.title);
	setText(nodes.shareRange, payload.rangeText);
	setText(nodes.shareCopy, payload.shareCard.copy);
	if (nodes.shareCanvas) nodes.shareCanvas.dataset.shareVariant = payload.shareCard.variant || 'standard';
	const highlights = payload.shareCard.highlights.length
		? payload.shareCard.highlights
		: [`启程远行 ${payload.summary.successfulDepartures}`, `平安归家 ${payload.summary.activeReturns}`, `鸟区晚高峰 ${payload.summary.chocoboRushHits}`];
	nodes.shareHighlights?.replaceChildren(
		...highlights.map((highlight: string) => {
			const item = document.createElement('span');
			item.textContent = highlight;
			return item;
		}),
	);
	void showShareQr();
}

function updateProgress(payload: RuntimePayload) {
	const percent = payload.slides.length <= 1 ? 100 : Math.round(((state.index + 1) / payload.slides.length) * 100);
	root.style.setProperty('--recap-progress', `${percent}%`);
}

function renderSlide(index: number) {
	const payload = state.payload;
	if (!payload) return;
	const slide = payload.slides[index] || payload.slides[0];
	state.index = Math.max(0, payload.slides.indexOf(slide));
	const isFirst = state.index === 0;
	const isLast = state.index === payload.slides.length - 1;
	setText(nodes.brand, payload.brand);
	setText(nodes.year, payload.year);
	setText(nodes.title, payload.title);
	setText(nodes.range, payload.rangeText);
	setText(nodes.currentBody, slide.body);
	setText(nodes.privacyNote, payload.privacyNote);
	setText(nodes.kicker, slide.kicker);
	setText(nodes.index, `${String(state.index + 1).padStart(2, '0')} / ${String(payload.slides.length).padStart(2, '0')}`);
	setText(nodes.slideTitle, slide.title);
	if (nodes.slideShell) nodes.slideShell.dataset.slideKind = slide.kind;
	root.classList.toggle('is-first-slide', isFirst);
	root.classList.toggle('is-final-slide', isLast);
	setHidden(nodes.finalActions, !isLast);
	renderTitleBarrage(slide);
	renderMetrics(slide);
	const footnote = displayText(slide.footnote);
	setText(nodes.footnote, footnote);
	setHidden(nodes.footnote, !footnote);
	renderTabs(payload);
	renderShare(payload);
	updateProgress(payload);
	root.dataset.currentSlide = slide.id;
	emitBridge('recap-slide-changed', { index: state.index, slideId: slide.id });
}

function renderEmpty(status: string, reason = '') {
	root.dataset.payloadStatus = status;
	if (reason) root.dataset.payloadError = reason;
	state.started = false;
	setHidden(nodes.stage, true);
	setHidden(nodes.timeline, true);
	setHidden(nodes.sharePanel, true);
	setHidden(nodes.start, true);
	setHidden(nodes.empty, false);
	setText(nodes.emptyTitle, status === 'waiting' ? '旅行簿整理中' : demoPayload.emptyState.title);
	setText(
		nodes.emptyBody,
		status === 'payload-invalid'
			? '这本旅行簿暂时打不开。回到 Astria天穹，再试一次。'
			: status === 'waiting'
				? 'Astria天穹正在等待 App 送来这一年的超域旅行记录。水晶已经点亮，请稍等。'
			: demoPayload.emptyState.body,
	);
	setText(nodes.emptyAction, status === 'waiting' ? '关闭' : demoPayload.emptyState.actionLabel);
}

function renderStart(payload: RuntimePayload) {
	root.dataset.payloadStatus = 'ready-to-start';
	state.started = false;
	setHidden(nodes.empty, true);
	setHidden(nodes.stage, true);
	setHidden(nodes.timeline, true);
	setHidden(nodes.sharePanel, true);
	setHidden(nodes.start, false);
	setText(nodes.startBrand, payload.brand);
	setText(nodes.startYear, payload.year);
	setText(nodes.startTitle, payload.shareCard.title || payload.summary.annualTitle || payload.title);
	setText(nodes.startCopy, payload.shareCard.copy || '这一年的旅行簿已经装订完成。');
	root.style.setProperty('--recap-progress', '0%');
}

function startRecap() {
	if (!state.payload) return;
	state.started = true;
	root.dataset.payloadStatus = 'started';
	setHidden(nodes.empty, true);
	setHidden(nodes.start, true);
	setHidden(nodes.stage, false);
	setHidden(nodes.timeline, false);
	setHidden(nodes.sharePanel, true);
	renderSlide(state.pendingStartIndex);
	emitBridge('recap-started', {
		index: state.index,
		slideId: state.payload.slides[state.index]?.id,
	});
}

function renderPayload(candidate: unknown, status = 'app') {
	const result = validatePayload(candidate);
	if (!result.payload) {
		renderEmpty('payload-invalid', result.error);
		emitBridge('recap-payload-rejected', { reason: result.error });
		return false;
	}
	state.payload = result.payload;
	state.index = 0;
	state.started = false;
	state.pendingStartIndex = 0;
	root.dataset.payloadStatus = status;
	renderStart(result.payload);
	emitBridge('recap-payload-accepted', {
		source: result.payload.source,
		slideCount: result.payload.slides.length,
		coreSlideCount: result.payload.slides.filter((slide: RuntimePayload) => slide.optional === false).length,
		optionalSlideCount: result.payload.slides.filter((slide: RuntimePayload) => slide.optional !== false).length,
		status,
	});
	return true;
}

function showShareCard() {
	if (!state.payload) return;
	renderShare(state.payload);
	setHidden(nodes.sharePanel, false);
	nodes.sharePanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function generateShareImage() {
	if (!state.payload || !nodes.shareCanvas || !nodes.generateShare) return;
	setText(nodes.shareStatus, '正在生成分享图...');
	nodes.generateShare.disabled = true;
	setHidden(nodes.sharePanel, false);
	try {
		await showShareQr();
		const dataUrl = await toPng(nodes.shareCanvas, {
			cacheBust: true,
			pixelRatio: 2,
			backgroundColor: '#111722',
		});
		setText(nodes.shareStatus, '分享图已生成。');
		emitBridge('share-image-created', {
			dataUrl,
			format: 'image/png',
			title: state.payload.shareCard.title,
		});
		if (!isEmbed) {
			const link = document.createElement('a');
			link.href = dataUrl;
			link.download = `astria-travel-recap-${state.payload.year}.png`;
			link.click();
		}
	} catch (error) {
		setText(nodes.shareStatus, '生成失败，请稍后再试。');
		emitBridge('share-image-failed', {
			message: error instanceof Error ? error.message : 'unknown error',
		});
	} finally {
		nodes.generateShare.disabled = false;
	}
}

nodes.tabs?.addEventListener('click', (event) => {
	const button = (event.target as Element).closest<HTMLElement>('[data-slide-tab]');
	if (!button || !state.payload || !state.started) return;
	renderSlide(Number(button.dataset.slideTab || 0));
});
nodes.next?.addEventListener('click', () => state.payload && state.started && turnPage(1));
nodes.backCover?.addEventListener('click', () => state.payload && state.started && renderSlide(0));
nodes.closeRecap?.addEventListener('click', () => emitBridge('recap-close-requested'));
nodes.emptyAction?.addEventListener('click', () => emitBridge('recap-close-requested'));
nodes.startButton?.addEventListener('click', startRecap);
nodes.shareButton?.addEventListener('click', showShareCard);
nodes.generateShare?.addEventListener('click', generateShareImage);
nodes.closeShare?.addEventListener('click', () => {
	setHidden(nodes.sharePanel, true);
	nodes.stage?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

function turnPage(direction: 1 | -1) {
	if (!state.payload || !state.started) return;
	const nextIndex = state.index + direction;
	if (nextIndex < 0 || nextIndex >= state.payload.slides.length) {
		emitBridge('recap-boundary-reached', { index: state.index, direction });
		return;
	}
	root.classList.add('is-changing');
	root.style.setProperty('--slide-shift', direction > 0 ? '18px' : '-18px');
	window.setTimeout(() => {
		if (!state.payload) return;
		renderSlide(nextIndex);
		window.setTimeout(() => root.classList.remove('is-changing'), 40);
	}, 120);
}

window.addEventListener('keydown', (event) => {
	if (!state.payload || !state.started) return;
	if (event.key === 'ArrowDown' || event.key === 'ArrowRight' || event.key === 'PageDown') turnPage(1);
	if (event.key === 'ArrowUp' || event.key === 'ArrowLeft' || event.key === 'PageUp') turnPage(-1);
});

let touchStartY = 0;
let lastWheelTurn = 0;
window.addEventListener(
	'touchstart',
	(event) => {
		touchStartY = event.changedTouches[0]?.clientY || 0;
	},
	{ passive: true },
);
window.addEventListener(
	'touchend',
	(event) => {
		if (!state.payload || !state.started) return;
		const deltaY = (event.changedTouches[0]?.clientY || 0) - touchStartY;
		if (Math.abs(deltaY) < 46) return;
		if (deltaY < 0) turnPage(1);
		if (deltaY > 0) turnPage(-1);
	},
	{ passive: true },
);
window.addEventListener(
	'wheel',
	(event) => {
		if (!state.payload || !state.started || Math.abs(event.deltaY) < 18) return;
		event.preventDefault();
		const now = Date.now();
		if (now - lastWheelTurn < 520) return;
		lastWheelTurn = now;
		turnPage(event.deltaY > 0 ? 1 : -1);
	},
	{ passive: false },
);

window.AstriaRecap = {
	render: (payload: unknown) => renderPayload(payload, 'app'),
	showEmpty: () => renderEmpty('empty'),
	getPayloadStatus: () => root.dataset.payloadStatus,
	createShareImage: generateShareImage,
};

window.addEventListener('message', (event) => {
	if (event.data?.type === 'astria:recap-payload') renderPayload(event.data.payload, 'app');
});
window.addEventListener('astria:recap-payload', (event) => {
	renderPayload((event as CustomEvent).detail, 'app');
});

const injected = window.__ASTRIA_RECAP_PAYLOAD__;
const searchParams = new URLSearchParams(window.location.search);
if (searchParams.get('debug') === 'invalid') renderPayload({ schemaVersion: SCHEMA_VERSION, slides: [] }, 'app');
else if (injected) renderPayload(injected, 'app');
else if (searchParams.get('demo') === 'minimal') renderPayload(minimalPayload(demoPayload), 'demo-minimal');
else if (searchParams.get('demo') === '1') renderPayload(demoPayload, 'demo');
else if (isEmbed) renderEmpty('waiting');
else renderPayload(demoPayload, 'demo');

const initialSlide = Number(searchParams.get('slide'));
if (state.payload && Number.isInteger(initialSlide)) {
	state.pendingStartIndex = Math.max(0, Math.min(state.payload.slides.length - 1, initialSlide));
}

emitBridge('recap-ready', { status: root.dataset.payloadStatus, embed: isEmbed });
