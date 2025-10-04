import Image from "next/image";

const integrations = [
  { name: "Slack", logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/slack.svg" },
  { name: "Notion", logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/notion.svg" },
  { name: "Linear", logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linear.svg" },
  { name: "Stripe", logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/stripe.svg" },
  { name: "HubSpot", logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/hubspot.svg" },
  { name: "Zapier", logo: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/zapier.svg" }
];

export function IntegrationGrid() {
  return (
    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
      {integrations.map((integration) => (
        <div
          key={integration.name}
          className="flex items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur"
        >
          <Image
            src={integration.logo}
            alt={integration.name}
            width={64}
            height={64}
            className="h-12 w-12 opacity-70"
          />
        </div>
      ))}
    </div>
  );
}
