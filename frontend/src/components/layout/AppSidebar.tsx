import { NavLink, useLocation } from 'react-router-dom';
import { ListOrdered, Shield, Swords, Users } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

const SECTIONS = [
  {
    title: 'Mercado',
    links: [
      { to: '/jogadores', label: 'Jogadores', icon: Users },
      { to: '/clubes', label: 'Clubes', icon: Shield },
    ],
  },
  {
    title: 'Liga',
    links: [
      { to: '/partidas', label: 'Partidas', icon: Swords },
      { to: '/classificacao', label: 'Classificação', icon: ListOrdered },
    ],
  },
];

export function AppSidebar() {
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Passe">
              <NavLink to="/jogadores">
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
                  P
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Passe</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Gestão da liga
                  </span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {SECTIONS.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.links.map((link) => (
                  <SidebarMenuItem key={link.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(link.to)}
                      tooltip={link.label}
                    >
                      <NavLink to={link.to}>
                        <link.icon />
                        <span>{link.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
