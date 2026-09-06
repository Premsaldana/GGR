# Integrating Unicorn Studio and 21st.dev into the Resort Frontend

## Core rule

Treat **Unicorn Studio as an optional visual experience** and **21st.dev as a component reference/source**, not as foundations of the application architecture.

The application should remain fully usable if the Unicorn Studio runtime fails, is blocked, is disabled for reduced motion, or is removed later. Components inspired by 21st.dev should be copied into the repository, normalized to your design system, tested, and owned by your codebase.

## Recommended frontend layers

```text
src/
  app/
    routes/
    layouts/
  components/
    ui/                 # buttons, dialogs, inputs, typography primitives
    resort/             # room cards, booking CTA, gallery, experience sections
    visual/
      UnicornScene.tsx  # isolated integration boundary
      ShaderFallback.tsx
      MotionReveal.tsx
  design-system/
    tokens.css
    motion.ts
    component-rules.md
  integrations/
    unicorn/
      client.ts
      types.ts
      performance.ts
    booking/
    analytics/
  content/
  lib/
```

Keep vendor-specific code in `integrations/unicorn` or a single `components/visual/UnicornScene.tsx`. Pages should consume a semantic component such as `<ResortHero />` or `<AtmosphereScene />`, never call Unicorn Studio directly.

## Unicorn Studio integration pattern

### 1. Define a semantic wrapper

Create a wrapper whose contract describes the resort experience rather than the vendor implementation.

```tsx
type AtmosphereSceneProps = {
  sceneId: string;
  fallbackImage: string;
  fallbackAlt: string;
  className?: string;
  priority?: boolean;
};

export function AtmosphereScene({
  sceneId,
  fallbackImage,
  fallbackAlt,
  className,
  priority = false,
}: AtmosphereSceneProps) {
  return (
    <section
      className={className}
      aria-label="Resort atmosphere"
      data-scene={sceneId}
    >
      <img
        src={fallbackImage}
        alt={fallbackAlt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div
        className="absolute inset-0"
        data-unicorn-scene={sceneId}
        aria-hidden="true"
      />
    </section>
  );
}
```

The fallback should be rendered first. The shader layer is decorative and must not contain the only copy, navigation, room facts, booking controls, or meaningful image description.

### 2. Load the runtime lazily

Do not load the visual runtime in the main bundle unless the hero is guaranteed to need it. Load it after the critical content is available, preferably when the scene is near the viewport or after the first meaningful render. Use a client-only boundary in SSR applications because browser APIs and canvas are unavailable during server rendering.

Conceptually:

```tsx
useEffect(() => {
  if (prefersReducedMotion || saveData || !supportsWebGL()) return;

  const loadScene = async () => {
    const { mountUnicornScene } = await import("@/integrations/unicorn/client");
    const cleanup = await mountUnicornScene({
      element,
      sceneId,
      onError: () => setFailed(true),
    });
    return cleanup;
  };

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      void loadScene();
      observer.disconnect();
    }
  }, { rootMargin: "200px" });

  observer.observe(element);
  return () => observer.disconnect();
}, [sceneId, prefersReducedMotion, saveData]);
```

Use the exact Unicorn Studio embed/API method supported by the version you adopt, but keep that method inside the adapter. This prevents vendor changes from leaking through the application.

### 3. Establish failure and device policies

Define a small policy module before adding the first scene:

| Condition | Behavior |
|---|---|
| Reduced motion enabled | Static fallback only |
| WebGL unavailable | Static fallback only |
| Save-Data or constrained connection | Static fallback or simplified effect |
| Runtime load failure | Keep fallback, record a non-fatal analytics event |
| Scene takes too long to initialize | Abort or keep fallback; never block content |
| Mobile viewport | Use a lower-complexity scene or fallback |
| Page hidden/unfocused | Pause animation if supported |

The visual layer should be **decorative, non-interactive, and aria-hidden** unless there is a deliberate accessible interaction design around it. If guests need to explore a map or choose a room, implement that as normal HTML and application state; do not make the shader canvas the control surface.

### 4. Keep scene configuration data-driven

```ts
export const resortScenes = {
  homeHero: {
    sceneId: "approved-home-hero",
    fallbackImage: "/media/home-hero.webp",
    fallbackAlt: "Early morning light across the resort gardens",
    maxMobileQuality: "low",
  },
  locationStory: {
    sceneId: "approved-location-story",
    fallbackImage: "/media/location-story.webp",
    fallbackAlt: "The resort landscape viewed from the arrival path",
    maxMobileQuality: "medium",
  },
} as const;
```

Do not scatter scene IDs, embed URLs, or quality settings across pages. Keep them in environment-specific configuration when the vendor provides different projects for staging and production.

### 5. Set performance budgets

Before approving a scene, measure the page with and without it. Set explicit budgets for initial JavaScript, shader assets, first meaningful content, largest contentful paint, interaction readiness, and mobile memory/thermal behavior. The exact numbers should be agreed from the current baseline, but the principle is firm: **the fallback must meet the page budget even if the enhancement cannot**.

## 21st.dev integration pattern

### 1. Use it as a pattern library

When selecting a component, document what you are borrowing: interaction model, layout idea, animation, or visual treatment. Do not import a generated page wholesale. Copy the smallest useful component into `components/ui` or `components/resort`, then remove unrelated dependencies and placeholder content.

### 2. Normalize every component

Before use, adapt the component to:

| Concern | Required adaptation |
|---|---|
| Styling | Replace hard-coded colors, shadows, radii, and spacing with project tokens |
| Typography | Use the approved resort font roles and type scale |
| Icons | Use the project icon policy and consistent stroke weight |
| Motion | Apply the project easing, duration, reduced-motion, and focus rules |
| Content | Replace sample copy with structured content props |
| Accessibility | Add semantics, labels, keyboard support, focus management, and announcements |
| Responsiveness | Test narrow mobile, tablet, desktop, and touch behavior |
| Dependencies | Remove libraries that are not justified by the component |
| Analytics | Add semantic events at the resort feature boundary, not inside generic primitives |

### 3. Separate primitives from resort components

A generic `Button`, `Dialog`, `Tabs`, or `Carousel` belongs in `components/ui`. A `RoomComparison`, `BookingDrawer`, `ExperienceRail`, or `ResortHeader` belongs in `components/resort` and should use the primitives. This prevents 21st.dev snippets from dictating your domain model.

### 4. Define stable component contracts

```tsx
type RoomCardProps = {
  name: string;
  summary: string;
  image: { src: string; alt: string };
  facts: Array<{ label: string; value: string }>;
  href: string;
  bookingHref?: string;
};
```

Components should receive clean domain props. They should not fetch directly from a vendor, contain database queries, or assume a particular CMS shape. Map CMS/API data into view-model props in a page or feature hook.

### 5. Create a review gate for every borrowed component

Before merging, answer:

1. Does this component solve a real resort journey problem?
2. Is the code now owned and understandable by the project team?
3. Does it use the project tokens rather than its original styling?
4. Does it work without hover, animation, or a mouse?
5. Does it support reduced motion and small screens?
6. Is its dependency and bundle cost justified?
7. Does it expose real loading, error, empty, and disabled states?
8. Does it preserve semantic HTML and accessible focus behavior?
9. Does its copy and imagery reflect the actual property?
10. Can it be removed without breaking the page’s core function?

## Combined page composition

Use normal application markup for the important page structure and layer the two sources of inspiration carefully:

```text
ResortPage
├── Semantic page heading and booking CTA
├── ResortHero
│   ├── Approved fallback image
│   ├── Optional AtmosphereScene / Unicorn layer
│   └── Real HTML headline and CTA
├── 21st-inspired editorial reveal
│   └── Rebuilt with project MotionReveal and tokens
├── RoomComparison
│   └── Domain component using project UI primitives
└── BookingHandoff
```

A visitor should be able to understand the property, navigate, compare rooms, submit an enquiry, and begin booking if both Unicorn Studio and every animation are disabled.

## Recommended build order

First build the static, accessible version of the route with approved content and imagery. Next add the tokenized 21st-inspired components. Then add the Unicorn Studio enhancement behind a feature flag. Finally measure the complete route on mobile and desktop, compare it to the static version, and keep the enhancement only if it improves atmosphere without harming comprehension, performance, accessibility, or conversion.

## Anti-patterns to avoid

Do not embed a Unicorn scene as the entire hero with no text fallback. Do not make a shader canvas the booking interaction. Do not load the visual runtime globally on every page. Do not paste an entire 21st.dev landing page into the repository. Do not let component snippets introduce a second design system. Do not accept hover-only or animation-dependent navigation. Do not ship generated imagery that misrepresents the actual resort. Do not optimize for visual novelty at the expense of room facts, policies, contact details, or booking confidence.

## Practical architecture decision

Use Unicorn Studio at the **experience boundary** and 21st.dev-derived code at the **component boundary**. The page and feature layers own guest journeys; the design system owns tokens and primitives; the integration layer owns vendor-specific runtime code; and the fallback path owns usability. That separation gives you a distinctive frontend without creating vendor lock-in or an unmaintainable AI-generated surface.
