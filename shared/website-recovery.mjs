// Generic recovery and the canonical publication draft can arrive separately.
// Require an explicit choice when their revisions disagree about the content.
export function websiteRecoveryConflict(recovered,canonical){return !!(recovered?.slug&&canonical&&Number.isInteger(recovered.serverRevision)&&recovered.serverRevision<canonical.revision&&JSON.stringify(recovered.content)!==JSON.stringify(canonical.content));}
