import SharePreview from './SharePreview';
import {useEffect, useRef, useState, type CSSProperties} from 'react';
import {ArrowUpRight, Check, Copy, Heart, Pencil, X} from 'lucide-react';
import {invitationSharing} from '../../shared/invitation-publication.mjs';
import type {SavedInvite} from './api';

type Props = {
  invitation: SavedInvite;
  templateName?: string;
  templateId: string;
  thumbnail?: string;
  totalSteps: number;
  celebrate: boolean;
  updated: boolean;
  onEdit: () => void;
  onClose: () => void;
};

const confetti = Array.from({length: 26}, (_, i) => ({
  '--x': `${(i * 37 + 7) % 100}%`,
  '--drift': `${(i % 2 ? 1 : -1) * (35 + i % 5 * 13)}px`,
  '--delay': `${(i % 7) * 0.09}s`,
  '--turn': `${180 + i * 43}deg`,
  background: ['#bf775d', '#d6b665', '#829d8c', '#dab0b7'][i % 4],
  borderRadius: i % 3 ? '2px' : '50%',
} as CSSProperties));

export default function InvitationPublished({invitation, templateId, templateName, thumbnail, totalSteps, celebrate, updated, onEdit, onClose}: Props) {
  const {url, names, message, whatsappUrl} = invitationSharing(invitation, location.origin,templateId);
  const [copied, setCopied] = useState(false), [copyError, setCopyError] = useState('');
  const title = useRef<HTMLHeadingElement>(null), linkInput = useRef<HTMLInputElement>(null);
  useEffect(() => { title.current?.focus(); }, []);
  useEffect(() => { if (!copied) return; const timer = window.setTimeout(() => setCopied(false), 3000); return () => window.clearTimeout(timer); }, [copied]);
  async function copyLink() {
    setCopyError('');
    try { await navigator.clipboard.writeText(url); setCopied(true); }
    catch { setCopied(false); linkInput.current?.focus(); linkInput.current?.select(); setCopyError('Your link is selected. Use your device’s Copy option to copy it.'); }
  }
  const expiry = new Intl.DateTimeFormat('en-IN', {day: 'numeric', month: 'short', year: 'numeric'}).format(new Date(invitation.expiresAt!));
  return <>
    {celebrate && <div className="iw-confetti" aria-hidden="true">{confetti.map((style, i) => <i key={i} style={style}/>)}</div>}
    <header className="iw-header iw-published-header">
      <button className="iw-close" aria-label="Close and return to templates" onClick={onClose}><X size={21}/></button>
      <span className="iw-step-label">STEP {totalSteps} OF {totalSteps}</span>
      <h2 id="iw-title" ref={title} tabIndex={-1}>{updated ? 'Your changes are live!' : 'Your wedding website is live!'}</h2>
      <p>{updated ? 'All set. Your guests will see the latest details at the same link.' : 'You made something beautiful. Now let your favourite people in.'}</p>
      <div className="iw-progress" role="progressbar" aria-label="Invitation complete" aria-valuenow={totalSteps} aria-valuemin={1} aria-valuemax={totalSteps}>{Array.from({length: totalSteps}, (_, i) => <span key={i} className="done"/>)}</div>
    </header>
    <div className="iw-body iw-published-body">
      <div className="iw-keepsake">
        {thumbnail && <img className="iw-keepsake-art" src={thumbnail} alt=""/>}
        <div className="iw-keepsake-copy">
          <span className="iw-live"><span/> LIVE & READY TO SHARE</span>
          <Heart className="iw-keepsake-heart" size={24} strokeWidth={1.3} aria-hidden="true"/>
          <h3>{names || 'Your celebration'}</h3>
          <p>{templateName || 'Your wedding invitation'}</p>
          <a className="iw-view-website" href={url} target="_blank" rel="noopener noreferrer">View your website <ArrowUpRight size={16}/></a>
        </div>
      </div>
      <SharePreview content={invitation.content} templateId={templateId} publishedSlug={invitation.slug}/>
      <div className="iw-share-link">
        <label htmlFor="published-invitation-link">A little link. A big celebration.</label>
        <div><input ref={linkInput} id="published-invitation-link" value={url} readOnly onFocus={e => e.target.select()}/><button onClick={copyLink} aria-label={copied ? 'Link copied' : 'Copy invitation link'}>{copied ? <Check size={17}/> : <Copy size={17}/>}<span>{copied ? 'Copied!' : 'Copy link'}</span></button></div>
        <p className={copyError ? 'iw-copy-feedback iw-copy-error' : 'iw-copy-feedback'} role="status" aria-live="polite">{copyError || (copied ? 'Link copied — ready to share with your people.' : 'This is the link your guests will open.')}</p>
      </div>
      <div className="iw-whatsapp-card">
        <h4>Your first invite, ready to send</h4>
        <p className="iw-whatsapp-note">A warm message and your link, ready for your people.</p>
        <a className="iw-whatsapp-button" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20.5 11.7a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.4-4.9a8.4 8.4 0 1 1 16.1-3.9Z"/><path d="M8.4 7.4c-.6.3-.8.9-.6 1.7.7 2.6 2.5 4.6 5.1 5.5.9.3 1.7.1 2.1-.5l.6-1-2-1-1 1c-1.4-.6-2.4-1.6-3-3l.8-.8-.9-2Z"/></svg>
          Share on WhatsApp <ArrowUpRight size={17}/>
        </a>
        <details className="iw-message-details"><summary>Preview your WhatsApp message</summary><p className="iw-message-preview">{message}</p></details>
      </div>
      <p className="iw-hosting-note">Live until {expiry}. You can come back and edit anytime.</p>
    </div>
    <footer className="iw-footer iw-published-footer"><button className="iw-back" onClick={onEdit}><Pencil size={15}/> Edit website</button><a href="/dashboard">My invitations <ArrowUpRight size={15}/></a></footer>
  </>;
}
