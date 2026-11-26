// Internal errors stay in diagnostic logs. The editor only presents plain,
// actionable messages; callers choose a fallback appropriate to their task.
const internal=/replicate|openai|\bxai\b|grok|flare|u[²2]-?net|rembg|vercel|supabase|razorpay|ffmpeg|ffprobe|webgl|three\.js|\b(?:api|sdk|sql|http|json|png alpha|provider|renderer|compositor|manifest|checksum|sha256|credentials?|tokens?|webhooks?|sandbox|blob|bucket|database|schema|endpoint|prediction|inference|generation|technical|payload|uuid|etag|deployment|storage)\b|prepared character dimensions|movement tracks?|master assets?|\b(?:type|syntax|reference|range|security|abort)error\b|failed to fetch|load failed|networkerror|not configured|https?:\/\/|[/\\](?:api|assets|node_modules)[/\\]|[{}<>]|\n\s*at\s/i;
export function videoCustomerMessage(value,fallback='We couldn’t complete that. Please try again.'){
 const message=typeof value==='string'?value.trim():'';
 if(/^the connection took too long\. please try again\.?$/i.test(message))return 'Reopen your invitation to check its latest saved status.';
 if(!message||message.length>350||internal.test(message))return fallback;
 return message;
}
