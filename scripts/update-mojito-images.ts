import { sql } from "../src/lib/db";

async function main() {
  const businessId = "e4386b0d-8540-460f-9dbd-cc0cdd2063dd";

  const updates = [
    { name: "Watermelon Mojito", image_url: "/images/menu/watermelon-mojito.jpg" },
    { name: "Blueberry Mojito", image_url: "/images/menu/blueberry-mojito.jpg" },
    { name: "Iced Tea", image_url: "/images/menu/iced-tea.jpg" },
    { name: "Peach Tea", image_url: "/images/menu/peach-tea.jpg" },
  ];

  for (const u of updates) {
    const res = await sql`
      UPDATE menu_items
      SET image_url = ${u.image_url}, updated_at = NOW()
      WHERE business_id = ${businessId} AND name ILIKE ${u.name}
      RETURNING id, name, image_url
    `;
    console.log(`Updated ${u.name}:`, res);
  }

  process.exit(0);
}

main().catch(console.error);

