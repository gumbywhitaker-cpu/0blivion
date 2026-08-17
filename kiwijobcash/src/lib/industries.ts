export type Industry = {
  slug: string;
  name: string;
  headline: string;
  leaks: string[];
  workflow: string;
  roiExample: { label: string; value: number }[];
};

export const INDUSTRIES: Industry[] = [
  {
    slug: "plumbers",
    name: "Plumbers",
    headline: "Stop losing callouts to slow follow-up.",
    leaks: [
      "Emergency callout enquiries that never get a reply after hours",
      "Quotes for bathroom or renovation work sent and forgotten",
      "Invoices for completed jobs sitting unpaid for weeks",
    ],
    workflow:
      "A customer messages about a leak on Friday night. Monday morning, Kiwi Job Cash flags it as an untouched lead worth an estimated $450 and drafts a follow-up ready to send.",
    roiExample: [
      { label: "3 uncontacted leads", value: 1350 },
      { label: "2 quotes waiting", value: 2400 },
      { label: "1 overdue invoice", value: 620 },
    ],
  },
  {
    slug: "electricians",
    name: "Electricians",
    headline: "Chase the quotes that are worth chasing.",
    leaks: [
      "Rewiring and switchboard quotes that expire before follow-up",
      "Small jobs invoiced but never checked for payment",
      "Regular commercial clients who've gone quiet",
    ],
    workflow:
      "A $3,200 switchboard upgrade quote sits unopened for 6 days. Kiwi Job Cash flags it as hot and drafts a check-in message before it goes cold.",
    roiExample: [
      { label: "4 quotes waiting", value: 3850 },
      { label: "2 overdue invoices", value: 980 },
      { label: "1 dormant commercial client", value: 1600 },
    ],
  },
  {
    slug: "builders",
    name: "Builders",
    headline: "Keep every quote and payment on track.",
    leaks: [
      "Renovation quotes with no scheduled follow-up",
      "Progress payments that fall behind schedule",
      "Past clients who'd renovate again if asked",
    ],
    workflow:
      "A kitchen renovation quote for $18,000 hasn't been followed up in 9 days. Kiwi Job Cash prioritises it at the top of your Action Centre.",
    roiExample: [
      { label: "2 large quotes waiting", value: 6200 },
      { label: "1 overdue progress payment", value: 4100 },
      { label: "2 dormant clients", value: 2200 },
    ],
  },
  {
    slug: "roofers",
    name: "Roofers",
    headline: "Don't let storm-season leads go cold.",
    leaks: [
      "Storm-damage enquiries that spike then get missed",
      "Roof replacement quotes with no follow-up plan",
      "Insurance-related invoices stuck in limbo",
    ],
    workflow:
      "After a storm, enquiries triple overnight. Kiwi Job Cash ranks them by value so the biggest jobs get contacted first.",
    roiExample: [
      { label: "5 storm-season leads", value: 4250 },
      { label: "2 quotes waiting", value: 5100 },
      { label: "1 overdue invoice", value: 1450 },
    ],
  },
  {
    slug: "landscapers",
    name: "Landscapers",
    headline: "Turn seasonal enquiries into booked work.",
    leaks: [
      "Spring enquiry surges that outpace follow-up capacity",
      "Landscaping quotes that need one more nudge to convert",
      "Regular maintenance clients who quietly stopped booking",
    ],
    workflow:
      "A $2,800 garden redesign quote goes quiet for a week. Kiwi Job Cash drafts a friendly check-in before the client books someone else.",
    roiExample: [
      { label: "3 seasonal leads", value: 1950 },
      { label: "2 quotes waiting", value: 3400 },
      { label: "3 dormant maintenance clients", value: 1350 },
    ],
  },
  {
    slug: "mechanics",
    name: "Mechanics",
    headline: "Get quotes approved and invoices paid faster.",
    leaks: [
      "Repair quotes customers need to think over — then forget",
      "Fleet or repeat customers whose invoices run overdue",
      "Regular customers who haven't been in for a service in a while",
    ],
    workflow:
      "A $1,200 repair quote is approved verbally but never confirmed. Kiwi Job Cash flags it after 3 days so it doesn't fall through the cracks.",
    roiExample: [
      { label: "4 quotes awaiting approval", value: 2600 },
      { label: "2 overdue fleet invoices", value: 1800 },
      { label: "5 dormant customers", value: 1250 },
    ],
  },
  {
    slug: "transport",
    name: "Transport & owner-drivers",
    headline: "Stay on top of invoicing across every job.",
    leaks: [
      "Job invoices delayed past the client's payment terms",
      "Rate quotes to new clients that never get a follow-up call",
      "Regular freight clients who've reduced bookings without a check-in",
    ],
    workflow:
      "An invoice for a completed run passes its 7-day terms. Kiwi Job Cash surfaces it as overdue with a ready-to-send reminder.",
    roiExample: [
      { label: "3 overdue invoices", value: 2450 },
      { label: "2 rate quotes pending", value: 1600 },
      { label: "1 quiet freight client", value: 900 },
    ],
  },
  {
    slug: "cleaners",
    name: "Cleaning businesses",
    headline: "Keep recurring revenue from quietly slipping away.",
    leaks: [
      "One-off clean enquiries that need a quick follow-up to convert",
      "Regular clients who paused and never restarted",
      "Invoices for one-off jobs that go unpaid",
    ],
    workflow:
      "A regular fortnightly client cancels one booking and never rebooks. Kiwi Job Cash flags them as dormant with an estimated value based on past bookings.",
    roiExample: [
      { label: "4 one-off enquiries", value: 680 },
      { label: "1 overdue invoice", value: 320 },
      { label: "6 paused regular clients", value: 2100 },
    ],
  },
];

export function getIndustry(slug: string) {
  return INDUSTRIES.find((i) => i.slug === slug);
}
