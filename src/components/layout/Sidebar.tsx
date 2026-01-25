import React from 'react';
import { useAuth } from '../../lib/context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  RateReview,
  Apartment,
  Build,
  People,
  Settings,
  Logout,
} from '@mui/icons-material';

const drawerWidth = 280;

interface SidebarProps {
  mobileOpen: boolean;
  onDrawerToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onDrawerToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const role = user?.role || 'staff';

  if (!role) {
    console.error('No role found for user hence taking role as staff', user);
  }

  const adminNavItems = [
    { label: 'Overview', path: '/overview', icon: <Dashboard /> },
    { label: 'Reviews', path: '/reviews', icon: <RateReview /> },
    { label: 'Outlet', path: '/infrastructure', icon: <Apartment /> },
    { label: 'Form Builder', path: '/form-builder', icon: <Build /> },
    { label: 'Managers', path: '/managers', icon: <People /> },
    { label: 'Settings', path: '/settings', icon: <Settings /> },
  ];
  const staffNavItems = [
    { label: 'Overview', path: '/overview', icon: <Dashboard /> },
    { label: 'Reviews', path: '/reviews', icon: <RateReview /> },
    { label: 'Settings', path: '/settings', icon: <Settings /> },
  ];

  const navItems = role === 'admin' ? adminNavItems : staffNavItems;

  const drawerContent = (
    <>
      <Toolbar sx={{ flexDirection: 'column', py: 3 }}>
        <Typography
          variant='h6'
          sx={{
            fontWeight: 900,
            letterSpacing: '0.3em',
            color: '#D4AF37',
          }}
        >
          ZAMZAM
        </Typography>
        <Typography variant='caption' sx={{ color: 'gray', mt: 1 }}>
          {`${role.charAt(0).toUpperCase() + role.slice(1)} Panel`}
        </Typography>
      </Toolbar>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      <List sx={{ px: 2, mt: 2 }}>
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.path);

          return (
            <ListItemButton
              key={item.path}
              onClick={() => {
                navigate(item.path);
                // Close mobile drawer on navigation if open
                if (mobileOpen) onDrawerToggle();
              }}
              sx={{
                borderRadius: 2,
                mb: 1,
                bgcolor: active ? '#D4AF37' : 'transparent',
                color: active ? '#1F2937' : 'rgba(255,255,255,0.7)',
                '&:hover': {
                  bgcolor: active ? '#D4AF37' : 'rgba(255,255,255,0.08)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: active ? '#1F2937' : 'rgba(255,255,255,0.7)',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: active ? 700 : 500,
                  fontSize: 14,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <List sx={{ px: 2, pb: 2 }}>
        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: 2,
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: '#ef4444',
              color: 'white',
              '& .MuiListItemIcon-root': {
                color: 'white',
              },
            },
          }}
        >
          <ListItemIcon
            className='MuiListItemIcon-root'
            sx={{ color: '#ef4444', minWidth: 40, transition: 'color 0.2s' }}
          >
            <Logout />
          </ListItemIcon>
          <ListItemText
            primary='Logout'
            primaryTypographyProps={{
              fontWeight: 600,
              fontSize: 14,
            }}
          />
        </ListItemButton>
      </List>
    </>
  );

  return (
    <Box
      component='nav'
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label='mailbox folders'
    >
      {/* Mobile Drawer */}
      <Drawer
        variant='temporary'
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            bgcolor: '#1F2937',
            color: 'white',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant='permanent'
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            bgcolor: '#1F2937',
            color: 'white',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
