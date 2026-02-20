export const SITE_NAME = "Rainbow CPaaS";
export const SITE_DESCRIPTION =
  "Add communications to your apps with Rainbow CPaaS. Messaging, voice, video conferencing, and more through simple APIs and SDKs.";
export const SITE_URL = "https://developers.rainbow.com";

export const NAV_ITEMS = [
  { label: "Docs", href: "/docs" },
  { label: "API Reference", href: "/api-reference" },
  { label: "SDKs", href: "/docs/sdk" },
  { label: "Support", href: "/support" },
] as const;

export const FOOTER_SECTIONS = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/" },
      { label: "Documentation", href: "/docs" },
      { label: "API Reference", href: "/api-reference" },
      { label: "SDKs", href: "/docs/sdk" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Getting Started", href: "/docs/getting-started" },
      { label: "Guides", href: "/docs/guides" },
      { label: "API Keys", href: "/portal/applications" },
      { label: "Sandbox", href: "/portal/sandbox" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Rainbow", href: "https://www.al-enterprise.com/rainbow", external: true },
      { label: "Support", href: "/support" },
      { label: "Legal", href: "/legal" },
      { label: "Privacy", href: "/legal/privacy" },
    ],
  },
] as const;

export const FEATURES = [
  {
    title: "Messaging & Chat",
    description:
      "Integrate instant messaging, group chats, and rich media sharing into your applications with simple API calls.",
    icon: "message",
  },
  {
    title: "Voice & Telephony",
    description:
      "Add voice calling, PBX integration, and telephony features including call management and routing.",
    icon: "phone",
  },
  {
    title: "Video Conferencing",
    description:
      "Embed video conferencing with screen sharing, recording, and multi-party calls directly in your apps.",
    icon: "video",
  },
  {
    title: "Bots & Automation",
    description:
      "Build intelligent chatbots and automate workflows with Rainbow's bot framework and webhook system.",
    icon: "bot",
  },
  {
    title: "Admin & Provisioning",
    description:
      "Manage users, companies, and resources programmatically through comprehensive administration APIs.",
    icon: "admin",
  },
  {
    title: "Presence & Contacts",
    description:
      "Access real-time presence information, manage contacts, and build directory services.",
    icon: "users",
  },
] as const;

export const SDK_LIST = [
  { name: "Node.js SDK", slug: "node", language: "JavaScript/TypeScript" },
  { name: "Web SDK", slug: "web", language: "JavaScript" },
  { name: "Android SDK", slug: "android", language: "Java/Kotlin" },
  { name: "iOS SDK", slug: "ios", language: "Swift/Objective-C" },
  { name: "C# SDK", slug: "csharp", language: "C#/.NET" },
] as const;
