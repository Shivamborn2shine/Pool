export const SITE_CONFIG = {
  name: "Loopa",
  legalName: "Loopa Technologies Pvt. Ltd.",
  tagline: "Digital loyalty cards for local businesses. No app download required.",
  description:
    "Create QR-based digital loyalty cards for cafés, salons, restaurants, gyms, and retail stores. Record purchases, approve customer claims, and redeem rewards with an auditable ledger.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://loopacards.netlify.app",
  lastUpdated: "October 30, 2026",
  supportEmail: "support@loopa.in",
  privacyEmail: "privacy@loopa.in",
  salesEmail: "hello@loopa.in",
  phone: "+91 80 4568 2910",
  whatsapp: "+91 98450 29100",
  address: "24, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038, India",
  hours: "Monday to Saturday, 9:00 AM – 7:00 PM IST",
  responseTimeExpectation: "Under 4 business hours for active merchants",
  guarantee:
    "14-day free trial on paid plans. No credit card required to start. Cancel anytime in two clicks, or export 100% of your customer and ledger data as CSV.",
  colors: {
    primary: "#18181B",
    accent: "#C2410C",
    backgroundLight: "#FAF9F6",
    backgroundDark: "#09090B",
  },
  pricingPlans: [
    {
      id: "starter",
      name: "Starter",
      priceMonthlyInr: 0,
      priceLabel: "₹0",
      period: "forever",
      description: "For single-counter cafés, bakeries, and studios testing digital loyalty.",
      limits: {
        customers: 150,
        staffMembers: 2,
        locations: 1,
      },
      features: [
        "Up to 150 active customer QR cards",
        "1 Owner + 1 Cashier account",
        "Admin purchase recording & points calculation",
        "Printable branded counter & customer cards",
        "Immutable transaction ledger",
      ],
      cta: "Start free",
      highlighted: false,
    },
    {
      id: "growth",
      name: "Growth",
      priceMonthlyInr: 999,
      priceLabel: "₹999",
      period: "per month + GST",
      description: "For busy cafés, salons, and retail stores running active repeat-visit programs.",
      limits: {
        customers: 2500,
        staffMembers: 10,
        locations: 3,
      },
      features: [
        "Up to 2,500 active customer QR cards",
        "Up to 10 staff accounts (Owner, Manager, Cashier)",
        "Customer self-service purchase claims with receipt uploads",
        "Separate Points & Store Credit (₹) wallets",
        "Campaign multipliers, signup bonuses & points expiry",
        "Up to 3 store locations & CSV data exports",
      ],
      cta: "Start 14-day trial",
      highlighted: true,
    },
    {
      id: "scale",
      name: "Scale",
      priceMonthlyInr: 2499,
      priceLabel: "₹2,499",
      period: "per month + GST",
      description: "For multi-branch hospitality and retail brands needing strict audit controls.",
      limits: {
        customers: 25000,
        staffMembers: 50,
        locations: 20,
      },
      features: [
        "Up to 25,000 active customer QR cards",
        "Up to 20 locations with branch-level reporting",
        "Manager adjustment thresholds & Owner approval queue",
        "Full audit trail with IP and before/after snapshots",
        "Priority onboarding & dedicated support (<2 hr SLA)",
      ],
      cta: "Book onboarding call",
      highlighted: false,
    },
  ],
  faqs: [
    {
      question: "Do our customers need to install a mobile app to use Loopa?",
      answer:
        "No. Every customer receives a unique QR code and secure web link. When they scan the QR code with their phone camera, their live card opens in under two seconds in any mobile browser showing their points balance, store credit, rewards, and transaction history.",
    },
    {
      question: "How do cashiers look up a customer at the billing counter?",
      answer:
        "Cashiers can scan the customer's QR card directly or search by phone number, customer name, or card number in the admin dashboard. Recording a purchase and granting points takes under 15 seconds.",
    },
    {
      question: "How does the customer purchase claim workflow prevent fake receipts?",
      answer:
        "Businesses can configure a claim submission window (e.g., within 7 days of purchase), a daily claim limit per customer, automatic duplicate detection (matching amount, date, or receipt number), and mandatory receipt photo uploads above a set rupee threshold. Every claim stays in a pending queue until an Owner or Manager approves it.",
    },
    {
      question: "What is the difference between Points Balance and Redeemable Store Credit?",
      answer:
        "Loopa tracks two separate wallets on every card: Points Balance (used to unlock catalog rewards like a free coffee or haircut) and Redeemable Store Credit in ₹ (used for direct bill discounts). Customers or staff can convert earned points into store credit according to your conversion rule, and managers can also grant store credit directly.",
    },
    {
      question: "Can cashiers change loyalty rules or add free points on their own?",
      answer:
        "No. Cashiers can only create customers, record purchases, and process redemptions. Only Owners and Managers can approve purchase claims or make manual point adjustments, and Manager adjustments above your configured threshold automatically require Owner approval.",
    },
    {
      question: "How do we protect customer cards since they open via a QR link?",
      answer:
        "QR codes never embed internal database IDs, balances, or personal secrets—only a high-entropy public card identifier. While viewing the card is instant, any write action on the public card page (submitting a claim, requesting a reward redemption, converting points, or changing consent preferences) requires verifying the last 4 digits of the customer's registered phone number.",
    },
    {
      question: "How does Loopa comply with India's Digital Personal Data Protection (DPDP) Act, 2023?",
      answer:
        "Loopa captures explicit, separate checkboxes for Loyalty Program processing consent and Marketing communication consent during customer creation. Customers can update their marketing preferences or submit a formal data export/deletion request directly from their card page.",
    },
    {
      question: "Can we print physical loyalty cards for customers who prefer keeping a card in their wallet?",
      answer:
        "Yes. Every customer profile includes a print-ready card layout formatted with your business logo, primary brand color, customer name, card number, and QR code, plus one-click PNG and SVG QR downloads.",
    },
    {
      question: "What happens if a customer requests a reward redemption online but changes their mind?",
      answer:
        "When a customer requests a redemption from their card page, the required points are deducted immediately in an atomic database transaction so they cannot double-spend. If your staff cancels or rejects the request at the counter, Loopa automatically writes an immutable reversal transaction that restores their exact balance.",
    },
  ],
};

