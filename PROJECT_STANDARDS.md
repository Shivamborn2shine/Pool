# AI Default Project Standards

## Purpose

This document defines the default features, UX patterns, accessibility rules, SEO requirements, and quality checks that must be included in every web project unless explicitly excluded by the user.

The AI must treat these as baseline requirements, not optional enhancements. If a feature is not relevant, the AI must state why it was omitted.

## 1. Global principles

Every project must be:

- Mobile-first: designed and tested for small screens before desktop.
- Fast: optimized images, minimal JavaScript, fast initial load.
- Accessible: usable by keyboard, screen readers, and users with low vision.
- Consistent: same spacing, typography, colors, buttons, and interaction patterns.
- Secure: no exposed secrets, validated inputs, protected admin routes.
- Professional: polished empty, loading, error, and success states.
- Maintainable: clear folder structure, reusable components, readable naming.
- Production-ready: metadata, favicon, sitemap, robots rules, and custom error pages.

## 2. Mandatory UI features

### Navigation menu

- Responsive navbar on desktop.
- Hamburger/menu button on mobile.
- Sticky header where useful.
- Active link indication.
- Accessible labels, e.g. aria-label="Open navigation menu".
- Menu closes on route change, outside click, and Escape.
- Logo links to homepage.

### Dark mode toggle

- Visible toggle in header or settings.
- Respect system preference by default.
- Persist choice in localStorage.
- Avoid flash of incorrect theme.
- Ensure all components work in both themes.
- Use semantic color tokens.

### Loading animations

- Page-level skeleton or spinner.
- Button loading state with disabled behavior.
- Form submission loading state.
- Data-fetch skeletons for lists, cards, dashboards, and tables.
- No layout shift.
- Accessible loading announcements where relevant.

### Hover and focus states

- All interactive elements need hover, focus, active, and disabled states.
- Keyboard focus must always be visible.
- Focus indicators need sufficient contrast.
- Do not remove outlines without an accessible replacement.
- Keyboard navigation must work throughout.

### Copy button

- Add to code snippets, coupon codes, card numbers, tracking IDs, URLs, and long values.
- Label: Copy.
- After copying: Copied! for 2 seconds.
- Use navigator.clipboard.writeText with fallback.
- Include aria-label="Copy value".

### Tooltips

- Use for icons, abbreviations, truncated text, and unclear actions.
- Show on hover and keyboard focus.
- Dismiss with Escape.
- Do not put essential information only in tooltips.
- Use accessible naming.

### Confirmation modal

Required for destructive or irreversible actions, including delete, reject, redeem, cancel, publish/unpublish, and remove.

- Clearly state action and consequence.
- Show affected record name or ID.
- Destructive button must be visually distinct.
- Use explicit wording, e.g. Delete customer.
- Trap focus, close on Escape, return focus to trigger.
- Use role="dialog" and aria-modal="true".

### Empty states

Every list, table, dashboard, search result, and inbox must handle empty data with:

- Friendly heading.
- Short explanation.
- Primary action where relevant.
- No blank area.

### Error states

Every form, API call, and data fetch must handle failure with:

- Clear human-readable message.
- No stack traces or raw database errors.
- Preserved user input.
- Retry where appropriate.
- Secure server-side logging.

## 3. Forms standard

Every form must include:

- Clear labels.
- Placeholders only as examples.
- Required-field indication.
- Inline validation messages.
- Success message after submission.
- Error summary for multi-error forms.
- Disabled submit button while submitting.
- Duplicate-submission protection.
- Confirmation modal for destructive/high-impact submissions.

### Form error messages

- Specific and helpful.
- Positioned near the field.
- Linked using aria-describedby.
- Announced to screen readers.
- Sufficient contrast.

### Form success states

- Show success message or confirmation page.
- Confirm what happened.
- Provide next-step guidance.
- Reset only after success.
- Track successful submissions where analytics exist.

## 4. Accessibility requirements

### Structure

- One h1 per page.
- Logical heading hierarchy.
- Semantic HTML: header, nav, main, footer, section, article, button, form.
- No fake buttons or links made from div/span.

### Keyboard support

- All actions usable with keyboard only.
- Logical tab order.
- Visible focus states.
- Modal focus trapping.
- Menus, tabs, accordions, and dropdowns support Enter, Space, Escape, and arrows where appropriate.

### Skip to content

- Include Skip to main content as one of the first focusable elements.
- Hidden until keyboard-focused.
- Jumps to main content.
- Visible and readable when focused.

### Color and contrast

- 4.5:1 minimum contrast for normal text.
- 3:1 minimum for large text.
- Do not rely on color alone.
- Dark mode must also meet contrast requirements.

### Images and media

- Meaningful images need descriptive alt text.
- Decorative images use alt="".
- Icon buttons need accessible names.
- Videos need captions where available.
- Do not autoplay audio/video with sound.

### Reduced motion

Respect user preferences:

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

## 5. SEO requirements

Every public website must include:

- Unique page title.
- Unique meta description.
- Canonical URL.
- Favicon.
- Open Graph tags.
- Twitter card tags.
- robots.txt.
- sitemap.xml.
- Structured data where relevant.
- Clean URLs.
- Custom 404 handling.

### Canonical tags

- Self-referencing canonical URL for indexable pages.
- Absolute URLs.
- Consistent www/non-www and trailing-slash format.
- Consistent with sitemap and internal links.

### Sitemap

- Generate sitemap.xml automatically.
- Include public indexable pages.
- Exclude admin, auth, checkout, dashboards, and private pages.
- Update automatically.
- Use lastModified where meaningful.

### Robots

- Create robots.txt.
- Allow public pages.
- Disallow private/admin routes.
- Reference sitemap URL.
- Use noindex for private pages.

### Favicon and social preview

- Browser favicon.
- Apple touch icon.
- Open Graph image.
- Twitter/X preview image.
- Correct site name and page titles.

## 6. Required pages

### Homepage

- What the product/service is.
- Who it is for.
- Key benefits.
- Primary CTA.
- Social proof if available.
- FAQ section.
- Contact or next-step CTA.

### About page

- Brand story.
- Mission or purpose.
- Who built it.
- Why it exists.
- Values or approach.
- Contact information/link.

### Services or features pages

For businesses with multiple offerings, create one page per service/major feature:

- Service name.
- Description.
- Benefits.
- Process/how it works.
- Pricing if applicable.
- FAQs.
- CTA.
- Unique SEO metadata.

### Contact page

- Contact form or details.
- Business hours if relevant.
- Location/map if relevant.
- Email, phone, WhatsApp, or social links.
- Response-time expectation.

### FAQ page or section

- Minimum 8 expandable questions.
- Accordion UI.
- Keyboard accessible.
- Use button with aria-expanded.
- Cover product, pricing, support, privacy, delivery, refund, and usage topics where relevant.

### Terms of Service

- Acceptance of terms.
- Service description.
- User responsibilities.
- Payments/refunds if applicable.
- Account termination.
- Limitation of liability.
- Changes to terms.
- Contact information.
- Last updated date.

### Privacy Policy

- Data collected.
- Purpose of collection.
- Use of data.
- Cookies/tracking.
- Third-party services.
- Data retention.
- User rights.
- Contact information.
- Last updated date.

For India-facing products, explain consent for loyalty programs, marketing, and personal-data processing in line with the Digital Personal Data Protection Act, 2023.

### Cookie Policy

If cookies/tracking are used:

- Necessary cookies.
- Analytics cookies.
- Marketing cookies.
- Third-party cookies.
- User controls.

### 404 page

- Friendly message.
- Search box if site search exists.
- Links to homepage and important pages.
- Consistent branding.

### 500/error page

- Apology.
- Explanation.
- Retry button.
- Homepage/support link.

## 7. Cookie banner

If non-essential cookies or third-party tracking are used:

- Appears on first visit.
- Offers Accept all, Reject non-essential, and Manage preferences.
- Links to Cookie Policy and Privacy Policy.
- Stores user choice.
- Does not load analytics/marketing scripts before consent.
- Allows later preference changes.
- Keyboard and screen-reader accessible.

## 8. UTM and analytics tracking

### Required UTM parameters

Capture and persist:

- utm_source
- utm_medium
- utm_campaign
- utm_term
- utm_content

### Implementation rules

- Capture UTMs on first landing.
- Store in localStorage or first-party cookie.
- Attach to form submissions, signups, and conversions.
- Exclude UTMs from canonical URLs.
- Track: page view, CTA click, form start, form submit, form success, form error, signup, purchase, contact click, WhatsApp click, file download.

### Analytics events

Use a central helper:

trackEvent("form_submit_success", {
  form: "contact",
  utm_source: "instagram",
  utm_campaign: "launch"
});

Never log passwords, OTPs, tokens, payment details, or sensitive personal data.

## 9. Site search

Include site search when the project has:

- 10+ public pages, or
- Product/service catalog, or
- Blog/help center, or
- Searchable dashboard records.

Requirements:

- Search icon in header.
- Keyboard shortcut such as / or Ctrl+K where appropriate.
- Debounced search.
- Empty-result state.
- Accessible results list.

## 10. Performance standards

### Images

- WebP/AVIF where supported.
- Compressed images.
- Explicit width and height.
- Lazy loading below the fold.
- Responsive srcset where appropriate.
- CDN/image optimization where available.

### Code

- Remove unused dependencies.
- Code-split large pages.
- Lazy-load non-critical components.
- Avoid large client bundles.
- Minimize third-party scripts.

### UX performance

- No layout shift.
- Skeletons instead of blank screens.
- Debounce expensive search/input operations.
- Cache safe GET requests where appropriate.

## 11. Print stylesheet

Every customer-facing or business project must include print styles:

- Hide navigation, cookie banner, ads, buttons, footers, and decoration.
- Show title, key content, contact info, and important dates.
- Black text on white background.
- Expand accordions when printed.
- Ensure cards, invoices, receipts, reports, and service pages print cleanly.

@media print {
  header, nav, footer, .cookie-banner, .no-print {
    display: none !important;
  }
  body {
    background: #fff;
    color: #000;
  }
}

## 12. Content standards

Every page must include:

- Clear headline.
- Benefit-led subheadline.
- Primary CTA.
- Supporting explanation.
- Trust signals where relevant.
- Last updated date for policies, pricing, documentation, and legal pages.

### Last updated date

Show on:

- Privacy Policy
- Terms of Service
- Cookie Policy
- Pricing page
- Documentation
- Blog posts
- Help articles
- Changelogs

Format: Last updated: October 30, 2026

### Guarantee statement

Include a clear guarantee or assurance statement where applicable, such as money-back guarantee, cancel anytime, no hidden fees, secure payments, data deletion on request, or support response time.

## 13. Security defaults

- Environment variables for secrets.
- No API keys in frontend code.
- Server-side validation.
- Client-side validation for UX only.
- Rate limiting on auth, contact, claim, and OTP endpoints.
- CSRF protection where applicable.
- Secure HTTP-only auth cookies.
- Role-based access control.
- HTTPS-only production.
- Secure headers.
- Input sanitization.
- File-type and size validation.
- Audit logs for sensitive admin actions.

## 14. Required UX states

For every major feature:

| State | Requirement |
|---|---|
| Loading | Skeleton/spinner and disabled controls |
| Empty | Friendly message and CTA |
| Success | Clear confirmation and next step |
| Error | Human-readable recovery message |
| Partial | Show available data and explain missing data |
| Offline | Detect connection loss where relevant |

## 15. Component checklist

- Navbar
- Mobile menu
- Footer
- Button
- Input
- Select
- Textarea
- Checkbox
- Radio group
- Form field wrapper
- Modal
- Confirmation modal
- Toast/notification
- Tooltip
- Accordion/FAQ
- Tabs
- Card
- Table
- Pagination
- Search bar
- Empty state
- Error state
- Loading skeleton
- Badge/status pill
- Copy button
- Dark-mode toggle
- Breadcrumbs
- Print-friendly layout

## 16. Project-specific additions

For a loyalty-card platform, also require:

- QR code display and download.
- Printable customer card.
- Copy card link button.
- Purchase claim status badges.
- Points balance skeleton.
- Redemption confirmation modal.
- Admin approval queue.
- Transaction history table.
- Export/report buttons.
- Role-based admin navigation.
- Audit trail for points changes.
- Consent capture during onboarding.
- Mobile-first customer card page.

## 17. Definition of done

- [ ] Mobile layout works.
- [ ] Desktop layout works.
- [ ] Dark mode works.
- [ ] Menu and mobile menu work.
- [ ] Forms validate and show success/error states.
- [ ] Loading states exist.
- [ ] Empty states exist.
- [ ] Confirmation modals protect destructive actions.
- [ ] Tooltips and copy buttons exist where useful.
- [ ] Hover and keyboard focus states work.
- [ ] Skip-to-content link works.
- [ ] Custom 404 and 500 pages exist.
- [ ] Favicon exists.
- [ ] Canonical tags exist.
- [ ] sitemap.xml exists.
- [ ] robots.txt exists.
- [ ] Open Graph/social preview exists.
- [ ] Cookie banner and policy pages exist if tracking is used.
- [ ] Privacy Policy, Terms, and About pages exist.
- [ ] FAQ has at least 8 expandable questions.
- [ ] UTM parameters are captured and attached to conversions.
- [ ] Images are compressed and responsive.
- [ ] Print stylesheet works.
- [ ] No secrets are exposed.
- [ ] Accessibility checked with keyboard navigation.

## 18. AI instruction prompt

Build this project using PROJECT_STANDARDS.md as mandatory defaults.

Include by default:
- responsive navbar and mobile menu
- sticky header where useful
- dark/light mode toggle
- loading skeletons and button loading states
- hover, active, disabled, and visible focus states
- accessible forms with inline errors and success states
- confirmation modals for destructive actions
- tooltips and copy buttons where useful
- empty states and error states
- custom 404 and 500 pages
- favicon, canonical tags, sitemap.xml, robots.txt, Open Graph tags
- cookie banner, Cookie Policy, Privacy Policy, Terms, and About page
- UTM capture and conversion tracking
- site search if the site has enough content
- expandable FAQs with at least 8 questions
- print stylesheet
- compressed responsive images
- accessible, mobile-first, high-quality minimal UI
- last updated dates on policy/content pages
- guarantee or trust statement where applicable

Do not remove these defaults unless explicitly asked.
If a default is not relevant, explain why.
