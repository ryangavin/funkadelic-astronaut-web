import './SiteNav.css';

export function SiteNav({ status }: { status?: string }) {
  const storybookUrl = `http://${window.location.hostname}:6006/`;

  return (
    <header className="site-nav">
      <a className="site-nav__brand" href="/">FA</a>
      <nav aria-label="Development surfaces">
        <a href="/workshop/">Workshop</a>
        <a href="/editor/">Puck editor</a>
        <a href="/preview/">Saved preview</a>
        <a href={storybookUrl}>Storybook ↗</a>
      </nav>
      {status ? <p className="site-nav__status" role="status">{status}</p> : null}
    </header>
  );
}
