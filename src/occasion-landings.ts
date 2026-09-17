import {
  occasionPages as catalogPages,
  occasionBySlug as catalogBySlug,
  OCCASION_SLUGS as catalogSlugs,
  templatesHref as catalogTemplatesHref,
  relatedLabel as catalogRelatedLabel
} from '../server/occasion-landings.mjs';

export type OccasionLandingPage={
 slug:string;
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
export const occasionBySlug=catalogBySlug as Record<string,OccasionLandingPage>;
export const OCCASION_SLUGS=catalogSlugs as string[];
export const templatesHref=catalogTemplatesHref as (tier:'royal'|'classic')=>string;
export const relatedLabel=catalogRelatedLabel as (href:string)=>string;
