# Poster framework and guided artist website builder

Concept notes from Ryan, September 12, 2026. This is a future product direction, not a decision to migrate the current website or publish a package now.

## Purpose

Package what we have learned building Funkadelic Astronaut into a small Node/npm module with a React-based framework for simple, pixel-perfect websites. Help artists turn their own artistic direction into a custom website, with an agent doing the implementation and the artist retaining precise visual control.

## Layout model

- Define two deliberate reference compositions: larger screens and compact/mobile.
- Within each composition, scale the layout uniformly, preserving pinned proportions instead of allowing independent sizes and offsets to drift.
- Support left, center, and right anchors, plus explicit vertical relationships to section boundaries and ribbons.
- Store positions, dimensions, scale, rotation, and transform origins in a consistent reference coordinate system.
- Use the currently approved full-screen Funkadelic Astronaut composition as the reference for the current site's scaling work.

## React components

Use components that own their behavior so an agent can extend the framework with new artwork, text, ribbons, galleries, video, and interactions. Shared primitives should preserve layout and styling conventions while allowing each artist's site to have its own visual identity.

## Corrections overlay

Ship a visual editing overlay for the inevitable final precision pass after the agent builds from the user's direction. The artist should be able to select an element and:

- Drag it to adjust its position.
- Resize or scale it.
- Apply small rotations and other transforms.
- Fine-tune its alignment and anchor relationships.

Edits should update the underlying layout values, rather than create disconnected temporary CSS overrides. Keep the reference coordinates consistent as the preview scales, so corrections remain accurate across widths within that composition.

Possible supporting features to evaluate: keyboard nudging, numeric inputs, snapping guides, undo/redo, reset, and saving/exporting adjustments for the agent to incorporate. These are proposals, not settled requirements.

## Guided experience

A conversational wizard could accompany the framework, potentially packaged as a plugin. Encourage voice while supporting text. Ask about the band's music, visual references, audience, and desired visitor actions. Alternate conversation with previews to arrive at an artistic vision, preserve approved decisions, then build and refine the site.

## Community story

Create an accessible article for artists who are unfamiliar with AI-assisted website building. Use the site, before-and-after examples, and real prompts to explain the process, including iteration and corrections. Share useful prompts and eventually a starter kit or framework. The website serves as a working example and a natural destination for readers.

## Open design questions

- The smallest useful framework API and initial component set.
- How reference compositions and breakpoint changes are represented.
- How visual edits are persisted and round-tripped into agent-authored code.
- How to preserve readable content, keyboard access, and usable touch targets while scaling compositions.
- What belongs in the npm package versus the conversational plugin.

## Two entry points, one editable website

Ryan's intended end-to-end experience has two entry points:

- Developers can use the React/npm framework directly for greater control and extensibility.
- Nondevelopers can install an integration in their preferred assistant, ideally Claude or ChatGPT, and follow a guided conversation through artistic direction, generation, visual corrections, and publication.

The guided experience should leave the artist with a website they can continue editing and walk them through choosing a publishing destination and getting it live. Both entry points should operate on the same underlying components and layout data, keeping direct developer work compatible with visual edits.

Assistant installation and integration are product aspirations; supported packaging and capabilities for each platform still need investigation. No platform compatibility has been verified yet.

## Broader scope

The framework should support custom marketing websites generally, not only band websites. Funkadelic Astronaut is the first worked example. The shared layout primitives, visual corrections overlay, and guided publishing journey should remain reusable across subjects; audience-specific discovery questions and components can adapt the experience to a band, artist, product, event, or business.

## Publishing home and launch sequence

Ryan wants to rework the existing Vibe's Pragmatic Guide to Not Shipping Garbage from a long-form book into a blog, so useful material can ship incrementally. The local project is at /Users/ryan/The Source/vibes-guide; its README points to satoramoto/vibes-guide and pragmatic.guide. It already uses Astro, MDX, and React.

The first proposed article is a practical walkthrough of making a band website with AI, using Funkadelic Astronaut as the example. Introduce the layout framework and guided builder when there is a usable release; do not present the currently proposed package as already available. Preserve existing book material as a resource while making individual articles the primary publishing format.

The intended cycle is: build useful free tools, publish accessible articles and demonstrations, distribute adapted material through Reddit, YouTube, and Instagram, invite readers to try the tools and contribute, and offer voluntary support for future work. Band-related content intersects naturally with Ryan's music without making the blog exclusively about the band. No social posts are authorized for immediate publication.

## Collective and funding direction under discussion

Satoru Moto is the proposed umbrella identity, with Open Flow potentially a creative-tool suite beneath it. The checked repository spells its owner satoramoto; confirm the intended public brand spelling before creating branding assets.

Ryan prefers a community-supported organization over a consulting business or founder-personality brand. A proposed funding split would send half of incoming support to a digital-rights organization such as EFF and half to a development pool. Eligibility for that pool, core contributor selection, voting, costs, and payout allocation remain to be designed. This is an idea under discussion, not an adopted giving policy, legal foundation status, EFF affiliation, or a payment commitment.

## Personal identity and voluntary support

Ryan's personal website should primarily serve as a résumé/portfolio. He is comfortable being identified as the founder and author in an About page, bylines, and commits; he is not seeking anonymity. The goal is to avoid making his public persona the center of the organization. The tools and community should be the reason people engage.

The desired income model is recurring voluntary patronage across a portfolio of freely available projects, rather than consulting, paid guided launches, or a recurring obligation to deliver custom services. Ryan hopes supporters will feel the tools are among their most valuable subscriptions even though payment is optional. Patreon was mentioned as a potential home, with crypto contributions as another possibility. These are preferences and aspirations, not a revenue forecast or a selected payment integration.

Potential distribution/support mechanisms discussed: a shared supporter destination, an optional request after a successful outcome, monthly and one-time contributions, a release newsletter, and a removable maker credit. Ryan explored requiring a contribution for agent-assisted credit removal; the recommendation was to keep removal straightforward and support voluntary. No credit restriction or payment gate was adopted.

The philosophical inspiration includes Bitcoin and tools that reduce restrictions on users: freely available information and tools, ownership of the finished output, and optional payment for convenience, services, or continued development. MIT licensing was suggested for the future framework, but has not been applied. Existing Vibe's Guide documentation describes a different license; a future conversion needs an explicit licensing decision.

## Status of this record

This document is a durable summary of the framework, brand, community, funding, and publishing discussion, not a verbatim transcript. The original conversation remains in the task history. No framework package, blog conversion, funding program, organizational restructuring, or social campaign has been implemented or published from these notes.

GitHub access was verified on September 12, 2026: the current authenticated account has ADMIN permission on satoramoto/vibes-guide. This does not establish permissions on every repository in that organization.
