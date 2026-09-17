import {useCallback, useEffect, useRef, useState} from 'react';
import type {PointerEvent as ReactPointerEvent} from 'react';
import {ArrowLeft, ArrowRight, GripHorizontal, Minus, Send, Sparkles, Undo2} from 'lucide-react';
import LoveRobot from './LoveRobot';
import './studio.css';

type Props = {
  sections: {id: string; label: string}[];
  activeSection: string;
  onSection: (id: string) => void;
  onSend: (message: string) => Promise<void>;
  busy: boolean;
  messages: {role: 'user' | 'assistant'; text: string}[];
  status: string;
  onUndo: () => void;
  canUndo: boolean;
};
type Position = {x: number; y: number};

export default function FloatingCopilot({sections, activeSection, onSection, onSend, busy, messages, status, onUndo, canUndo}: Props) {
  const [minimized, setMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [position, setPosition] = useState<Position | null>(null);
  const [viewportHeight, setViewportHeight] = useState(window.visualViewport?.height ?? window.innerHeight);
  const panel = useRef<HTMLElement>(null);
  const conversation = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  const dragging = useRef<{pointer: number; x: number; y: number; left: number; top: number} | null>(null);
  const index = Math.max(0, sections.findIndex(section => section.id === activeSection));
  const section = sections[index];
  const clamp = useCallback((point: Position): Position => {
    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0;
    const width = viewport?.width ?? window.innerWidth, height = viewport?.height ?? window.innerHeight;
    const box = panel.current?.getBoundingClientRect();
    return {x: Math.max(left + 8, Math.min(point.x, left + width - (box?.width ?? 300) - 8)), y: Math.max(top + 8, Math.min(point.y, top + height - (box?.height ?? 280) - 8))};
  }, []);
  useEffect(() => {
    const resize = () => {
      const viewport = window.visualViewport;
      setViewportHeight(viewport?.height ?? window.innerHeight);
      const box = panel.current?.getBoundingClientRect();
      const desktop = window.innerWidth >= 1200;
      const home = {x: (viewport?.offsetLeft ?? 0) + (viewport?.width ?? window.innerWidth) - (box?.width ?? 300) - (desktop ? 20 : 12), y: (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - (box?.height ?? 280) - (desktop ? 24 : 16)};
      setPosition(old => clamp(moved.current && old ? old : home));
    };
    resize();
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('scroll', resize);
    const observer = new ResizeObserver(resize);
    if (panel.current) observer.observe(panel.current);
    return () => { window.removeEventListener('resize', resize); window.visualViewport?.removeEventListener('resize', resize); window.visualViewport?.removeEventListener('scroll', resize); observer.disconnect(); };
  }, [clamp]);
  useEffect(() => { if (conversation.current) conversation.current.scrollTop = conversation.current.scrollHeight; }, [messages, busy, minimized]);
  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button') || event.button !== 0) return;
    const box = panel.current?.getBoundingClientRect(); if (!box) return;
    dragging.current = {pointer: event.pointerId, x: event.clientX, y: event.clientY, left: box.left, top: box.top};
    event.currentTarget.setPointerCapture(event.pointerId); event.preventDefault();
  };
  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragging.current; if (!drag || drag.pointer !== event.pointerId) return;
    moved.current = true;
    setPosition(clamp({x: drag.left + event.clientX - drag.x, y: drag.top + event.clientY - drag.y}));
  };
  const endDrag = () => { dragging.current = null; };
  const submit = async () => {
    const value = message.trim(); if (!value || busy) return;
    setError(''); setMessage('');
    try { await onSend(value); }
    catch { setMessage(value); setError('That change could not be saved. Please try again.'); }
  };
  return <aside ref={panel} className={`fmi-copilot${minimized ? ' fmi-copilot--mini' : ''}${viewportHeight < 500 ? ' fmi-copilot--compact' : ''}`} aria-label="Invitation copilot" style={{left: position?.x, top: position?.y, right: position ? 'auto' : 16, bottom: position ? 'auto' : 16, maxHeight: Math.max(120, viewportHeight - 16)}}>
    <div className="fmi-copilot-drag" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag} title="Drag to move your copilot">
      <GripHorizontal size={17} aria-hidden="true"/>
      {!minimized && <LoveRobot busy={busy}/>}
      <span>{minimized ? 'Your little helper' : busy ? 'Lovebot is thinking…' : 'Lovebot · ready to help'}</span>
      {!minimized && <button type="button" aria-label="Minimize copilot" onClick={() => setMinimized(true)}><Minus size={17}/></button>}
    </div>
    {minimized ? <button className="fmi-copilot-bubble" type="button" onClick={() => setMinimized(false)} aria-label="Open invitation copilot"><LoveRobot busy={busy}/><span>Need a little love?<b>Let’s create <Sparkles size={12}/></b></span></button> : <>
      <div className="fmi-copilot-section"><span>{sections.length ? `${index + 1} / ${sections.length}` : 'YOUR INVITATION'}</span><strong>{section?.label ?? 'Your invitation'}</strong><button type="button" title="Undo last change" aria-label="Undo last change" onClick={onUndo} disabled={!canUndo || busy}><Undo2 size={15}/></button></div>
      <div ref={conversation} className="fmi-copilot-conversation" role="log" aria-label="Copilot conversation" aria-live="polite" aria-relevant="additions text">
        {messages.length === 0 ? <p className="fmi-copilot-message fmi-copilot-message--assistant">What would you like to change in <strong>{section?.label ?? 'this section'}</strong>? You can also skip ahead.</p> : messages.map((item, i) => <p key={i} className={`fmi-copilot-message fmi-copilot-message--${item.role}`}><span className="fmi-copilot-sr">{item.role === 'user' ? 'You: ' : 'Copilot: '}</span>{item.text}</p>)}
        {busy && <p className="fmi-copilot-thinking"><span/><span/><span/><span className="fmi-copilot-sr">Working on your changes</span></p>}
      </div>
      {error && <p className="fmi-copilot-error" role="alert">{error}</p>}
      <form className="fmi-copilot-form" onSubmit={event => { event.preventDefault(); void submit(); }}>
        <label htmlFor="fmi-copilot-input" className="fmi-copilot-sr">Describe your changes</label>
        <textarea id="fmi-copilot-input" rows={2} value={message} maxLength={2000} onChange={event => setMessage(event.target.value)} placeholder="Try “Our names are Ashok & Supriya”" onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void submit(); } }}/>
        <button type="submit" aria-label="Send changes" disabled={busy || !message.trim()}><Send size={17}/></button>
      </form>
      <footer className="fmi-copilot-footer"><button type="button" aria-label="Previous section" onClick={() => { if (index > 0) onSection(sections[index - 1].id); }} disabled={index === 0 || busy}><ArrowLeft size={15}/></button><span role="status">{status}</span><button type="button" className="fmi-copilot-skip" onClick={() => { if (index < sections.length - 1) onSection(sections[index + 1].id); }} disabled={index >= sections.length - 1 || busy}>{index >= sections.length - 1 ? 'Last section' : 'Skip / next'}<ArrowRight size={14}/></button></footer>
    </>}
  </aside>;
}
