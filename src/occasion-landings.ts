import {
  occasionPages as catalogPages,
  occasionBySlug as catalogBySlug,
  OCCASION_SLUGS as catalogSlugs,
  DESIGN_SLUGS as catalogDesignSlugs,
  LANDING_SLUGS as catalogLandingSlugs,
  designPages as catalogDesignPages,
  templatesHref as catalogTemplatesHref,
  ctaHref as catalogCtaHref,
  demoHref as catalogDemoHref,
  relatedLabel as catalogRelatedLabel
} from '../server/occasion-landings.mjs';

export type OccasionLandingPage={
 kind?:'design';
 slug:string;
 templateId?:string;
 name:string;
 keyword:string;
 tier:'royal'|'classic';
 h1:string;
 title:string;
 description:string;
 cta:string;
 hero:string;
 includes:string;
 who:string;
 how:string;
 switchCopy:string;
 related:string[];
 faqs:[string,string][];
};

export const occasionPages=catalogPages as OccasionLandingPage[];
export const designPages=catalogDesignPages as OccasionLandingPage[];
export const occasionBySlug=catalogBySlug as Record<string,OccasionLandingPage>;
export const OCCASION_SLUGS=catalogSlugs as string[];
export const DESIGN_SLUGS=catalogDesignSlugs as string[];
export const LANDING_SLUGS=catalogLandingSlugs as string[];
export const templatesHref=catalogTemplatesHref as (tier:'royal'|'classic')=>string;
export const ctaHref=catalogCtaHref as (page:OccasionLandingPage)=>string;
export const demoHref=catalogDemoHref as (page:OccasionLandingPage)=>string;
export const relatedLabel=catalogRelatedLabel as (href:string)=>string;
