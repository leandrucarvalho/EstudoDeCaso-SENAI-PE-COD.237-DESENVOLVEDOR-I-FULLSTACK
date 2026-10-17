import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { useCrumbLabel } from '@/lib/crumb-label';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface Crumb {
  label: string;
  to?: string;
}

function buildCrumbs(pathname: string, label: string | null): Crumb[] {
  const [section, id] = pathname.split('/').filter(Boolean);

  switch (section) {
    case 'jogadores':
      return [{ label: 'Mercado' }, { label: 'Jogadores' }];
    case 'clubes':
      return id
        ? [
            { label: 'Mercado' },
            { label: 'Clubes', to: '/clubes' },
            { label: label ?? `Clube ${id}` },
          ]
        : [{ label: 'Mercado' }, { label: 'Clubes' }];
    case 'partidas':
      return id
        ? [
            { label: 'Liga' },
            { label: 'Partidas', to: '/partidas' },
            { label: label ?? `Partida ${id}` },
          ]
        : [{ label: 'Liga' }, { label: 'Partidas' }];
    case 'classificacao':
      return [{ label: 'Liga' }, { label: 'Classificação' }];
    default:
      return [{ label: 'Passe' }];
  }
}

export function Topbar() {
  const { pathname } = useLocation();
  const crumbs = buildCrumbs(pathname, useCrumbLabel());

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;

            return (
              <Fragment key={crumb.label}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : crumb.to ? (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.to}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </BreadcrumbItem>
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
