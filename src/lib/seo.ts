import { site, guides } from "../data/site";
import { featurePages } from "../data/feature-pages";

export const socialImage = `${site.origin}/brand/astria-social-card.png`;

export function canonicalURL(path: string) {
  const pathname = new URL(path, site.origin).pathname;
  return new URL(pathname, site.origin).href;
}

export function isPrivateShell(path: string) {
  return /^\/(?:s|pc|bind|recap|travel-annual-recap)(?:\/|$)/.test(path);
}

export function pageStructuredData(path: string, title: string, description: string) {
  const url = canonicalURL(path);
  const websiteID = `${site.origin}/#website`;
  const publisherID = `${site.origin}/#publisher`;
  const page: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: "zh-CN",
    isPartOf: { "@id": websiteID },
    publisher: { "@id": publisherID },
  };
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": publisherID,
      name: site.name,
      url: `${site.origin}/`,
      logo: `${site.origin}/brand/astria-app-icon.png`,
    },
    {
      "@type": "WebSite",
      "@id": websiteID,
      name: site.name,
      alternateName: ["天穹", "Astria"],
      url: `${site.origin}/`,
      inLanguage: "zh-CN",
      publisher: { "@id": publisherID },
    },
    page,
  ];
  const breadcrumbs = [{ name: "首页", item: `${site.origin}/` }];
  const guide = guides.find((item) => path === `/guides/${item.slug}/`);
  const feature = featurePages.find((item) => path === `/features/${item.slug}/`);
  if (guide) {
    breadcrumbs.push({ name: "使用指南", item: `${site.origin}/guides/` });
    breadcrumbs.push({ name: guide.title, item: url });
    page["@type"] = "Article";
    page.headline = guide.title;
    page.author = { "@id": publisherID };
    page.mainEntityOfPage = url;
  } else if (feature) {
    breadcrumbs.push({ name: "功能介绍", item: `${site.origin}/features/` });
    breadcrumbs.push({ name: feature.label, item: url });
  } else {
    const labels: Record<string, string> = {
      "/features/": "功能介绍",
      "/start/": "开始使用",
      "/guides/": "使用指南",
      "/updates/": "更新日志",
    };
    if (labels[path]) breadcrumbs.push({ name: labels[path], item: url });
  }
  if (breadcrumbs.length > 1) {
    const breadcrumbID = `${url}#breadcrumb`;
    page.breadcrumb = { "@id": breadcrumbID };
    graph.push({
      "@type": "BreadcrumbList",
      "@id": breadcrumbID,
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        ...item,
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
