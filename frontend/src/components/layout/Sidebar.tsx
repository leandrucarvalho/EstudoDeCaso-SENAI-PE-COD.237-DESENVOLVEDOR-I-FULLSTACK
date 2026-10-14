import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

const SECTIONS = [
  {
    title: 'Mercado',
    links: [
      { to: '/jogadores', label: 'Jogadores' },
      { to: '/clubes', label: 'Clubes' },
    ],
  },
  {
    title: 'Liga',
    links: [
      { to: '/partidas', label: 'Partidas' },
      { to: '/classificacao', label: 'Classificação' },
    ],
  },
];

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.logo}>P</span>
        <div>
          <strong>Passe</strong>
          <p className={styles.tagline}>Gestão da liga</p>
        </div>
      </div>

      <nav>
        {SECTIONS.map((section) => (
          <div key={section.title} className={styles.section}>
            <p className={styles.sectionTitle}>{section.title}</p>
            {section.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles.active}` : styles.link
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}