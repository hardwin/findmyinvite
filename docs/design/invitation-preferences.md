# Invitation preferences

Local implementation, November 17, 2026. Do not deploy until requested.

First-time storefront visitors see an anchored language chooser below the right-hand
header control. Tapping a language immediately applies it and opens an invitation-tradition dialog,
presented as a bottom sheet on phones. Its question is: “Which tradition should your
invitation celebrate?” The choices are Christian, Hindu, and Islam. These describe
the requested invitation; the application does not infer the visitor's religion.

Tapping a tradition immediately saves the completed choices and closes the sheet.
There are no Continue, Save, or confirmation buttons. Account sync runs in the
background so a slow connection does not delay browsing or personalization.
The header control reopens the language chooser. Returning visitors tap a new
language to apply it and close the popup, or select “Change celebration style”
to update their invitation tradition with one selection.
Closing the prompt dismisses it for the browsing session. Completed choices persist
on the browser. Language uses the existing six-language website-preview/form flow;
this feature does not translate fixed video previews or change video renderers.

Recommendations use the existing authored tradition taxonomy. Matching designs
rank first, followed by unclassified/interfaith designs, then the remaining designs.
The full catalogue stays available. Explicit searches, filters, and price/name sorting
retain their meaning. Search masonry remeasures when its displayed item identities change.

## Account persistence

- Guest choices are claimed once by the account used at login.
- Supabase Auth user metadata stores only the validated `language` and `tradition`
  under `invitation_preferences`; no database migration is required.
- `/api/auth?action=invitation-preferences` supports authenticated GET and PUT.
  PUT forwards the customer's token to Auth `/user`, with an allowlisted metadata
  payload. It never accepts an account ID, roles, email changes, or arbitrary metadata.
- Login/refresh responses include sanitized `user.invitationPreferences`; saved
  choices also live in the existing authenticated browser session. Session-only
  sign-in retains its original storage behavior.
- Legacy sessions hydrate from the authenticated endpoint. Failed account sync keeps
  the local choice active and pending; it retries on subsequent visits without
  interrupting browsing or requiring another save click.
- Separate browser keys isolate each account. Preferences are not sent to analytics
  and are not used for authorization.

## Local verification

`tests/server-invitation-preferences.mjs` covers validation, token requirements,
metadata allowlisting, upstream errors, session serialization, and recommendation order.
`tests/browser-invitation-preferences.mjs` covers the first-visit flow, responsive
dialogs, guest persistence, language changes, explicit search intent, Google callback,
account restoration/isolation, session-only sign-in, retry, and dismissal in Chromium
and WebKit. Auth/Supabase responses in these tests are mocked; no production account
or database is modified.
