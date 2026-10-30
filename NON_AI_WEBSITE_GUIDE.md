# Non-AI Website Design & Quality Guide

## Purpose

This guide defines how to design, build, and review websites so they look intentionally designed, credible, human-made, and trustworthy—not like generic AI-generated templates.

Use this document for every landing page, business website, portfolio, SaaS marketing site, local-business site, documentation site, and customer-facing product.

The goal is not to “trick” detection tools. The goal is to create a website with real craft: clear content, useful interactions, consistent branding, accessible UX, working links, and a distinctive visual identity.

## 1. Core principle

A website should look like it was made by a person or team who understands the business.

Avoid the default “AI website” look:

- Generic blue-to-purple gradient hero.
- Excessive rounded corners.
- Stock AI illustrations.
- Vague marketing copy.
- Identical card grids.
- Overuse of glassmorphism.
- Random emoji in headings.
- Generic “Empower your business with AI” language.
- No real business details.
- Buttons and links that do not work.
- No privacy policy, terms, contact details, or documentation.

Instead, build a website that feels specific, useful, and credible.

## 2. Visual identity rules

### Color

Do not use the following as the primary visual identity:

- Blue-to-purple gradients.
- Purple-to-pink gradients.
- Generic indigo/violet SaaS palette.
- Neon gradients.
- Rainbow gradients.
- Large colored blur blobs behind hero sections.

Use a restrained, intentional palette:

- One primary brand color.
- One accent color, used sparingly.
- Neutral background and text colors.
- Clear success, warning, and error colors.
- High-contrast text.

Recommended palette structure:

| Role | Example |
|---|---|
| Background | Off-white, warm white, light gray, or solid dark |
| Surface | White, light gray, or slightly elevated dark surface |
| Text | Near-black or near-white |
| Primary | Deep green, forest green, charcoal, navy, burgundy, terracotta, or brand-specific color |
| Accent | Amber, olive, rust, teal, or muted complementary color |
| Border | Subtle gray or dark neutral |
| Success | Green |
| Warning | Amber |
| Error | Red |

Avoid using gradients as a substitute for good typography, hierarchy, and layout. If a gradient is necessary, keep it extremely subtle and brand-relevant—not blue-purple.

### Borders and corners

Avoid excessive rounded corners.

Default rules:

- Use small radii only: `2px`, `4px`, or `6px`.
- Prefer square or slightly rounded corners for professional/business websites.
- Use `border-radius: 0` for editorial, legal, documentation, agency, and premium minimal designs.
- Do not use pill-shaped buttons everywhere.
- Do not use large `24px+` border radius on cards, images, buttons, and inputs by default.
- Keep corner radius consistent across the entire site.

Recommended radius system:

| Element | Recommended radius |
|---|---|
| Buttons | 0–6px |
| Inputs | 0–6px |
| Cards | 0–8px |
| Images | 0–8px |
| Modals | 0–8px |
| Badges | 0–4px |
| Avatars | Circular only when semantically appropriate |

### Typography

Use typography to create hierarchy.

Requirements:

- Use a distinctive but readable font pairing.
- Avoid overused default combinations without customization.
- Use clear heading scale.
- Use readable body text: usually 16–18px on desktop.
- Keep line length around 60–80 characters.
- Use proper letter spacing and line height.
- Avoid all-caps long paragraphs.
- Avoid decorative fonts for body copy.
- Do not use emoji as a replacement for icons or headings.

Example hierarchy:

| Element | Style |
|---|---|
| H1 | Large, bold, clear benefit-led headline |
| H2 | Section heading |
| H3 | Feature or subsection heading |
| Body | 16–18px, readable line height |
| Caption | Small, muted, but still accessible |
| Button | Clear action label, strong contrast |

### Layout

Avoid the generic AI layout pattern:

- Centered gradient hero.
- Three identical feature cards.
- Logo strip.
- Another three-card section.
- Generic testimonial carousel.
- Generic CTA banner.

Use varied, purposeful layouts:

- Asymmetric hero where appropriate.
- Editorial grids.
- Real screenshots or product visuals.
- Numbered process sections.
- Comparison tables.
- Case studies.
- Detailed FAQ.
- Clear pricing table.
- Real contact information.
- Useful footer with actual links.

## 3. Anti-generic content rules

Content must be specific to the business.

### Avoid vague AI copy

Do not use phrases like:

- “Unlock your potential.”
- “Empower your business.”
- “Revolutionize the way you work.”
- “Seamless experience.”
- “Cutting-edge solutions.”
- “Next-generation platform.”
- “Supercharge your workflow.”
- “Transform your business with AI.”
- “The future of [industry].”

### Write specific copy

Use concrete language:

| Weak AI copy | Better human-sounding copy |
|---|---|
| “We provide innovative solutions.” | “We build QR-based loyalty cards for cafés, salons, and local retailers.” |
| “Empowering businesses to grow.” | “Track repeat customers, reward purchases, and redeem points without paper cards.” |
| “Seamless experience.” | “Customers scan a QR code and see their points instantly.” |
| “Cutting-edge technology.” | “Works on any phone browser. No app download required.” |
| “Get started today.” | “Create your first loyalty card in under two minutes.” |

### Required real business details

Every credible business website should include:

- Business name.
- Clear explanation of what it does.
- Who it is for.
- Pricing or pricing approach.
- Contact method.
- Location or service area if relevant.
- Founder/team or company details where appropriate.
- Real FAQ answers.
- Terms of Service.
- Privacy Policy.
- Refund/cancellation policy if payments are involved.
- Support or response-time expectation.
- Last updated date on legal/content pages.

## 4. Landing page requirements

A landing page must do more than look attractive. It must explain, convince, and guide the visitor.

### Above the fold

Include:

- Clear headline.
- Specific subheadline.
- Primary call to action.
- Secondary call to action if useful.
- Product screenshot, demo, illustration, or real visual.
- Trust signal if available.

Example structure:

```text
[Logo]                         [Features] [Pricing] [Docs] [Contact] [Get Started]

Digital loyalty cards for local businesses

Create customer cards, reward purchases, and let customers
track points by scanning a QR code.

[Create free card]   [See how it works]

[Product screenshot or QR card preview]
```

### Below the fold

Include:

- Problem statement.
- How it works.
- Features explained in business terms.
- Screenshots or product visuals.
- Use cases.
- Pricing or pricing link.
- FAQ.
- Testimonials/case studies only if real.
- Final CTA.
- Complete footer.

### CTA rules

- Every page has one primary action.
- CTA text should be specific: “Create loyalty card”, “Book a demo”, “Download guide”.
- Avoid vague CTAs like “Learn more” for every button.
- Buttons must visibly work.
- Primary CTA should be repeated at logical points.
- Do not use misleading CTAs.

## 5. Interaction quality checklist

A website fails the “non-AI/generic” test if basic interactions are broken.

### Buttons

Every button must have:

- Clear label.
- Purposeful action.
- Hover state.
- Focus state.
- Active/pressed state.
- Disabled state when unavailable.
- Loading state for async actions.
- Consistent styling.
- Sufficient contrast.

Button types:

| Type | Use |
|---|---|
| Primary | Main action, one per view where possible |
| Secondary | Supporting action |
| Tertiary/text | Low-priority action |
| Destructive | Delete, cancel, revoke, remove |
| Icon button | Must have accessible name |

### Links

Every link must:

- Work.
- Open the correct destination.
- Have a visible hover state.
- Have a visible focus state.
- Use descriptive text.
- Open external sites in a new tab only when appropriate.
- Include `rel="noopener noreferrer"` for external links opened in new tabs.

Avoid:

- “Click here.”
- Bare URLs as link text.
- Broken anchors.
- Dead social links.
- Placeholder `#` links in production.

### Forms

Every form must have:

- Labels.
- Validation.
- Inline error messages.
- Success confirmation.
- Loading state.
- Protection against duplicate submission.
- Accessible fields.
- Working submit action.

### Hover effects

Hover effects should be subtle and useful.

Good hover effects:

- Slight background change.
- Border color change.
- Underline on links.
- Shadow elevation on cards.
- Icon movement.
- Tooltip reveal.

Avoid:

- Extreme scale animations.
- Rotating elements.
- Flashing colors.
- Complicated parallax.
- Hover effects that hide content.
- Hover-only information.

## 6. Required working pages

Every credible public website must include working pages, not placeholder pages.

### Mandatory pages

| Page | Requirement |
|---|---|
| Home | Clear value proposition, CTA, product/service explanation |
| About | Real story, mission, team or company context |
| Contact | Working form or real contact details |
| Privacy Policy | Data collection, use, retention, user rights |
| Terms of Service | Rules, liability, payments, account termination |
| 404 | Helpful recovery page |
| 500/Error | Recovery message and retry option |

### Conditional pages

| Page | When required |
|---|---|
| Pricing | If product/service has pricing |
| FAQ | For most public/business websites |
| Documentation/Guides | For software, tools, APIs, and products requiring setup |
| Blog | If content marketing is part of strategy |
| Services | For agencies, local businesses, and multi-offering companies |
| Service detail pages | One page per major service |
| Case studies | If real customer results exist |
| Refund policy | If payments, subscriptions, or bookings exist |
| Cookie policy | If cookies/tracking are used |
| Accessibility statement | For public-facing products and government-adjacent projects |
| Changelog | For software products |
| Status page | For SaaS/products with uptime expectations |

## 7. Guides and documentation standards

If the website offers a product, tool, or service that requires setup, include real documentation.

### Documentation must include

- Getting started guide.
- Setup/installation instructions.
- Account creation steps.
- Core workflow explanation.
- Screenshots or annotated visuals.
- Common tasks.
- Troubleshooting.
- FAQ.
- Contact/support link.
- Last updated date.

### Documentation quality rules

- Use numbered steps.
- Use real examples.
- Avoid vague instructions.
- Include expected results after each step.
- Include error explanations.
- Include keyboard/mobile instructions where relevant.
- Keep documentation updated when the product changes.

Example structure:

```text
1. Create an account
2. Add your business details
3. Create your first customer
4. Generate the QR loyalty card
5. Print or share the card
6. Record a purchase
7. Approve customer claims
8. Redeem points
```

## 8. Trust and credibility checklist

A website should show real signals of legitimacy.

Include where relevant:

- Real business name.
- Real contact email/phone.
- Physical address or service area.
- Business registration details if applicable.
- Founder/team information.
- Real testimonials with permission.
- Case studies with measurable outcomes.
- Security information.
- Refund policy.
- Support response time.
- Social links that actually work.
- Copyright year.
- Last updated dates.
- Professional email domain, not a random free email if possible.

Avoid:

- Fake testimonials.
- Fake logos.
- Fake customer counts.
- Fake reviews.
- Fake security badges.
- Fake press mentions.
- Fake team photos.
- Fake statistics.

## 9. Accessibility requirements

Accessibility makes a website feel professionally built.

### Must-have accessibility features

- Semantic HTML.
- One `h1` per page.
- Logical heading order.
- Keyboard navigation.
- Visible focus states.
- Skip-to-content link.
- Descriptive alt text.
- Accessible form labels.
- Sufficient color contrast.
- No color-only status indicators.
- Accessible modals.
- Accessible mobile menu.
- Reduced-motion support.
- Descriptive link text.
- Accessible icon buttons.

### Contrast rules

- Normal text: at least 4.5:1 contrast.
- Large text: at least 3:1 contrast.
- UI components and graphical objects: at least 3:1 contrast.
- Do not use light gray text on white backgrounds for important content.
- Do not use low-contrast placeholder-only forms.

## 10. Performance and polish

### Images

- Compress all images.
- Use WebP/AVIF where supported.
- Set width and height.
- Lazy-load below-the-fold images.
- Avoid huge hero images.
- Avoid generic AI-generated stock visuals.
- Prefer real product screenshots, diagrams, photos, or custom illustrations.

### Animation

- Use subtle transitions.
- Keep animations under 300–500ms for UI feedback.
- Respect `prefers-reduced-motion`.
- Do not animate essential content unnecessarily.
- Avoid autoplaying video with sound.

### Technical polish

- No console errors.
- No broken images.
- No mixed-content warnings.
- HTTPS enabled.
- Custom favicon.
- Correct page titles.
- Meta descriptions.
- Canonical tags.
- Sitemap.
- Robots.txt.
- Open Graph preview.
- Mobile responsive.
- Fast loading.
- No horizontal scroll on mobile.

## 11. Non-AI / generic-template review checklist

Mark each item as Pass, Fail, or N/A. A website should pass nearly all applicable items before launch.

### Branding and visual identity

- [ ] The site has a distinctive primary brand color.
- [ ] No blue-purple gradient is used as the main visual identity.
- [ ] No generic purple/pink SaaS gradient.
- [ ] No large decorative gradient blobs.
- [ ] Color palette is consistent across all pages.
- [ ] Border radius is consistent and restrained.
- [ ] No excessive rounded corners.
- [ ] Typography hierarchy is clear.
- [ ] Fonts are readable and intentionally chosen.
- [ ] Spacing is consistent.
- [ ] Icons are consistent in style.
- [ ] Images look relevant and intentional.
- [ ] No generic AI stock illustrations.
- [ ] The site does not look like an untouched template.

### Content quality

- [ ] Homepage explains what the business does in one sentence.
- [ ] Target customer is clear.
- [ ] Primary benefit is clear.
- [ ] Copy is specific, not generic.
- [ ] No vague AI marketing phrases.
- [ ] Product/service features are explained clearly.
- [ ] Pricing is clear or easy to find.
- [ ] FAQ answers real customer questions.
- [ ] FAQ has at least 8 useful questions.
- [ ] About page tells a real story.
- [ ] Contact information is real and visible.
- [ ] Legal pages are complete.
- [ ] Last updated dates appear on policy/content pages.
- [ ] No fake testimonials, logos, reviews, or statistics.

### Landing page quality

- [ ] Clear headline above the fold.
- [ ] Specific subheadline.
- [ ] Primary CTA is visible.
- [ ] CTA text is specific.
- [ ] Product/service visual is present.
- [ ] Problem is explained.
- [ ] How it works is explained.
- [ ] Features are explained in customer terms.
- [ ] Use cases are included where relevant.
- [ ] Pricing or pricing link is present.
- [ ] FAQ is present.
- [ ] Final CTA is present.
- [ ] Footer contains useful links.
- [ ] Page has a clear next step.

### Buttons and links

- [ ] All buttons work.
- [ ] All links work.
- [ ] No placeholder `#` links in production.
- [ ] Primary CTA has hover state.
- [ ] Secondary buttons have hover state.
- [ ] Links have hover state.
- [ ] Buttons have focus state.
- [ ] Buttons have active/pressed state.
- [ ] Disabled buttons are visually distinct.
- [ ] Async buttons show loading state.
- [ ] Destructive actions use confirmation.
- [ ] External links behave correctly.
- [ ] No broken social links.
- [ ] No dead footer links.

### Forms

- [ ] Every field has a label.
- [ ] Required fields are marked.
- [ ] Invalid input shows a clear error.
- [ ] Error messages are specific.
- [ ] Success message appears after submission.
- [ ] Submit button shows loading state.
- [ ] Duplicate submissions are prevented.
- [ ] Form works on mobile.
- [ ] Form is keyboard accessible.
- [ ] Contact form sends to a real destination.

### Navigation and UX

- [ ] Navbar works on desktop.
- [ ] Mobile menu works.
- [ ] Menu closes after navigation.
- [ ] Active page/link is indicated.
- [ ] Sticky header works without covering content.
- [ ] Footer navigation works.
- [ ] Breadcrumbs exist where useful.
- [ ] Internal search exists where useful.
- [ ] Empty states are designed.
- [ ] Error states are designed.
- [ ] Loading states are designed.
- [ ] No horizontal scrolling on mobile.
- [ ] No overlapping elements.
- [ ] No cut-off text.

### Documentation and support

- [ ] Getting-started guide exists if needed.
- [ ] Setup steps are numbered.
- [ ] Screenshots or visuals are included where useful.
- [ ] Common tasks are documented.
- [ ] Troubleshooting section exists.
- [ ] FAQ is linked from docs.
- [ ] Support/contact link works.
- [ ] Docs have a last updated date.
- [ ] Documentation matches the current product.

### Trust, legal, and compliance

- [ ] Privacy Policy exists.
- [ ] Terms of Service exist.
- [ ] Cookie Policy exists if tracking is used.
- [ ] Cookie banner works if tracking is used.
- [ ] Refund/cancellation policy exists if payments exist.
- [ ] Contact details are real.
- [ ] Business identity is clear.
- [ ] Copyright year is correct.
- [ ] No misleading claims.
- [ ] No fake urgency.
- [ ] No hidden fees.
- [ ] User consent is collected where required.

### SEO and technical quality

- [ ] Unique title for every page.
- [ ] Unique meta description for every page.
- [ ] Canonical tag on every indexable page.
- [ ] Favicon exists.
- [ ] Open Graph preview exists.
- [ ] `sitemap.xml` exists.
- [ ] `robots.txt` exists.
- [ ] Custom 404 page exists.
- [ ] Custom 500 page exists.
- [ ] HTTPS works.
- [ ] No console errors.
- [ ] No broken images.
- [ ] Images are compressed.
- [ ] Site loads quickly.
- [ ] Mobile layout works.
- [ ] Tablet layout works.
- [ ] Desktop layout works.

### Accessibility

- [ ] Skip-to-content link works.
- [ ] Keyboard navigation works.
- [ ] Focus states are visible.
- [ ] Color contrast passes.
- [ ] Images have appropriate alt text.
- [ ] Icon buttons have accessible names.
- [ ] Forms have labels.
- [ ] Modals are accessible.
- [ ] Reduced-motion preference is respected.
- [ ] No hover-only essential information.
- [ ] Headings follow logical order.

## 12. Final quality bar

Before calling a website complete, ask:

1. Can a visitor understand what this business does within 5 seconds?
2. Can they find the next action immediately?
3. Do all buttons and links work?
4. Does the design look intentional rather than template-generated?
5. Is the content specific to this business?
6. Are legal, privacy, contact, and support pages complete?
7. Does it work properly on mobile?
8. Can a keyboard user use it?
9. Does it avoid the generic blue-purple AI aesthetic?
10. Would a real customer trust this business after visiting?

If any answer is “no”, the website is not finished.

## 13. AI build instruction

Add this to every project brief:

```text
Follow NON_AI_WEBSITE_GUIDE.md.

Do not use generic AI-looking design patterns:
- no blue-purple gradients
- no purple-pink gradients
- no generic SaaS gradient hero
- no excessive rounded corners
- no generic three-card layouts without purpose
- no vague AI marketing copy
- no fake testimonials, logos, or statistics
- no placeholder links or non-working buttons

Use:
- restrained brand-specific color palette
- small or zero border radius
- clear typography hierarchy
- specific benefit-led copy
- real business details
- working navigation, buttons, links, and forms
- complete About, Contact, Privacy Policy, Terms, FAQ, and 404 pages
- guides/documentation where the product needs setup
- accessible, mobile-first, fast, polished UI
- subtle hover and focus states
- real screenshots, diagrams, or relevant visuals

Before completion, run through the full checklist in
NON_AI_WEBSITE_GUIDE.md and fix every failed item.
```
