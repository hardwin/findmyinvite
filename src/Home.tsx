import './storefront3.css';
import { Button, Header, Icon } from './components';
import { templates } from './data';

const imagePath = (name: string) => name ? `/assets/${name}` : '/assets/4cfcddd6f8996fe3.png';

export default function Home() {
  return (
    <main className="fmi-home-dark">
      <div className="home-stars" aria-hidden="true" />
      <Header full />
      <section className="home-hero-dark">
        <div className="home-hero-copy">
          <div className="home-badge"><span><Icon name="sparkles" size={14} /></span> Premium digital invitations</div>
          <h1>Make every<br /><em>moment</em> unforgettable.</h1>
          <p>Beautiful invitation webpages for weddings, celebrations, and all the moments worth gathering for.</p>
          <div className="home-actions">
            <Button href="/templates" className="home-glow-button">Explore templates <Icon name="arrow" size={16} /></Button>
            <Button href="/invite/demo?template=royal-prestige" outline className="home-outline-button">View live demo</Button>
          </div>
          <p className="home-note">Create in minutes · Share with everyone · No guest account required</p>
        </div>
        <div className="home-orbit" aria-hidden="true"><div className="home-orbit-card orbit-back"><img src={imagePath(templates[4].image)} alt="" /></div><div className="home-orbit-card orbit-front"><img src={imagePath(templates[0].image)} alt="" /><span>Royal<br />Imperial</span></div><div className="home-orbit-card orbit-side"><img src={imagePath(templates[8].image)} alt="" /></div></div>
      </section>
      <section className="home-templates" id="templates">
        <div className="home-section-heading"><div><p className="home-kicker">The collection</p><h2>Templates made<br /><em>to be remembered.</em></h2></div><Button href="/templates" outline className="home-all-button">View all templates <Icon name="arrow" size={15} /></Button></div>
        <div className="home-template-rail">{templates.map((template, index) => <a className="home-template-card" href={`/create?template=${template.id}`} key={template.id}><div className="home-template-image"><img src={imagePath(template.image)} alt={`${template.name} invitation template`} loading={index > 2 ? 'lazy' : undefined} /><span className="home-template-index">{String(index + 1).padStart(2, '0')}</span>{template.badge && <span className="home-template-badge">{template.badge}</span>}<span className="home-template-arrow"><Icon name="arrow" size={15} /></span></div><div className="home-template-meta"><h3>{template.name}</h3><p>{template.description}</p></div></a>)}</div>
      </section>
      <section className="home-bottom-line"><p>One beautiful link for every celebration.</p><Button href="/templates">Start creating <Icon name="arrow" size={15} /></Button></section>
    </main>
  );
}

// Keep the homepage focused on discovery: the full catalog remains available at /templates.
void 0;
