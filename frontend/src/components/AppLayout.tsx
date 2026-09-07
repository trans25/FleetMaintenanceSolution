import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Button,
  Divider,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Text,
  Tooltip,
  makeStyles,
  shorthands,
  tokens
} from '@fluentui/react-components';
import {
  Alert24Regular,
  CalendarClock24Regular,
  ClipboardTaskListLtr24Regular,
  DataBarVertical24Regular,
  DocumentBulletList24Regular,
  MailInbox24Regular,
  Navigation24Regular,
  SignOut24Regular,
  VehicleCar24Regular,
  VehicleTruck24Regular,
  Home24Regular,
  Person24Regular,
  Building24Regular,
  Wrench24Regular
} from '@fluentui/react-icons';
import { useAuth, ADMIN_ROLES, MANAGER_ROLES, TECHNICIAN_ROLES } from '../auth/AuthContext';

const useStyles = makeStyles({
  root: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gridTemplateRows: '48px 1fr',
    gridTemplateAreas: `"header header" "nav main"`,
    height: '100vh'
  },
  header: {
    gridArea: 'header',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f6cbd',
    color: '#ffffff',
    ...shorthands.padding('0', '16px')
  },
  brand: { display: 'flex', alignItems: 'center', columnGap: '8px', fontWeight: 600 },
  nav: {
    gridArea: 'nav',
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRight('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.padding('8px'),
    display: 'flex',
    flexDirection: 'column',
    rowGap: '2px',
    transitionProperty: 'width',
    transitionDuration: '150ms'
  },
  navWide: { width: '220px' },
  navNarrow: { width: '56px' },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    columnGap: '12px',
    ...shorthands.padding('8px', '10px'),
    ...shorthands.borderRadius('6px'),
    color: tokens.colorNeutralForeground1,
    textDecorationLine: 'none',
    whiteSpace: 'nowrap',
    ':hover': { backgroundColor: tokens.colorNeutralBackground3Hover }
  },
  navItemActive: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    fontWeight: 600
  },
  main: {
    gridArea: 'main',
    ...shorthands.overflow('auto'),
    ...shorthands.padding('24px', '32px'),
    backgroundColor: tokens.colorNeutralBackground1
  }
});

interface NavLink {
  to: string;
  label: string;
  icon: JSX.Element;
  roles?: string[];
}

const links: NavLink[] = [
  { to: '/', label: 'Dashboard', icon: <Home24Regular /> },
  { to: '/fleets', label: 'Fleets', icon: <VehicleTruck24Regular />, roles: MANAGER_ROLES },
  { to: '/vehicles', label: 'Vehicles', icon: <VehicleCar24Regular /> },
  { to: '/manufacturers', label: 'Manufacturers', icon: <Wrench24Regular />, roles: MANAGER_ROLES },
  { to: '/faults', label: 'Faults', icon: <Alert24Regular /> },
  { to: '/jobcards', label: 'Job Cards', icon: <ClipboardTaskListLtr24Regular />, roles: TECHNICIAN_ROLES },
  { to: '/service-schedules', label: 'Service Schedules', icon: <CalendarClock24Regular />, roles: TECHNICIAN_ROLES },
  { to: '/compliance', label: 'Compliance', icon: <DocumentBulletList24Regular />, roles: MANAGER_ROLES },
  { to: '/notifications', label: 'Notifications', icon: <MailInbox24Regular /> },
  { to: '/reports', label: 'Reports', icon: <DataBarVertical24Regular />, roles: MANAGER_ROLES },
  { to: '/administration', label: 'Administration', icon: <Building24Regular />, roles: ADMIN_ROLES }
];

export default function AppLayout() {
  const styles = useStyles();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, hasAnyRole } = useAuth();
  const [expanded, setExpanded] = useState(true);

  const visibleLinks = links.filter((link) => !link.roles || hasAnyRole(...link.roles));
  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', columnGap: 8 }}>
          <Button
            appearance="transparent"
            icon={<Navigation24Regular />}
            style={{ color: '#fff' }}
            onClick={() => setExpanded((e) => !e)}
            aria-label="Toggle navigation"
          />
          <span className={styles.brand}>
            <VehicleTruck24Regular /> Fleet Maintenance
          </span>
        </div>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button appearance="transparent" style={{ color: '#fff' }}>
              <Avatar name={user?.username} size={28} color="colorful" />
              <Text style={{ color: '#fff', marginLeft: 8 }}>{user?.username}</Text>
            </Button>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem icon={<Person24Regular />} onClick={() => navigate('/account')}>
                My account
              </MenuItem>
              <Divider />
              <MenuItem icon={<SignOut24Regular />} onClick={handleSignOut}>
                Sign out
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </header>

      <nav className={`${styles.nav} ${expanded ? styles.navWide : styles.navNarrow}`}>
        {visibleLinks.map((link) => {
          const item = (
            <Link
              key={link.to}
              to={link.to}
              className={`${styles.navItem} ${isActive(link.to) ? styles.navItemActive : ''}`}
            >
              {link.icon}
              {expanded && <span>{link.label}</span>}
            </Link>
          );
          return expanded ? (
            item
          ) : (
            <Tooltip key={link.to} content={link.label} relationship="label" positioning="after">
              {item}
            </Tooltip>
          );
        })}
      </nav>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
