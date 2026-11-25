// Server/editor bridge to the approved Anbil Avan runtime content contract.
// Validation and chapter timing come from the runtime itself, so the server,
// preview and layered export cannot drift. Fixed headings are not editable.
import {FIELD_KEYS,CHAPTERS} from '../../anbil-avan-v1/content.js';
export {FIELD_KEYS,CHAPTERS,CUTS,dateLabel,timeLabel,validateFields} from '../../anbil-avan-v1/content.js';
export const SAMPLE_FIELDS=Object.freeze({bride:'Priya',groom:'Arun',weddingDate:'2026-12-10',weddingTime:'08:00',weddingVenue:'Manipal',receptionDate:'2026-12-09',receptionTime:'18:00',receptionVenue:'Manipal'});
export const requiredKeys=()=>FIELD_KEYS;
export const durationOf=()=>35.04;
export const chaptersFor=()=>CHAPTERS;
export const buildDetails=fields=>({...fields});
