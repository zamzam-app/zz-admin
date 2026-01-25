import React from 'react';
import { useAuth } from '../../lib/context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../common/Logo'; // 1. Ensure this path is correct
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 2. LOGO SECTION UPDATED */}
      <Toolbar sx={{ flexDirection: 'column', py: 4, gap: 1 }}>
        <Box sx={{ mb: 1 }}>
          <Logo className="w-16 h-16 shadow-2xl" />
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant='h6'
            sx={{
              fontWeight: 900,
              letterSpacing: '0.2em',
              color: '#D4AF37',
              fontSize: '1.2rem',
              lineHeight: 1
            }}
          >
            ZAMZAM
          </Typography>
          <Typography 
            variant='caption' 
            sx={{ 
              color: 'rgba(255,255,255,0.5)', 
              fontWeight: 600, 
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              mt: 0.5,
              display: 'block'
            }}
          >
            {`${role} Panel`}
          </Typography>
        </Box>
      </Toolbar>

      <Divider sx={{ borderColor: 'rgba(212, 175, 55, 0.2)', mx: 3 }} />

      <List sx={{ px: 2, mt: 3, flexGrow: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.path);

          return (
            <ListItemButton
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (mobileOpen) onDrawerToggle();
              }}
              sx={{
                borderRadius: '16px',
                mb: 1,
                py: 1.5,
                bgcolor: active ? '#D4AF37' : 'transparent',
                color: active ? '#1F2937' : 'rgba(255,255,255,0.7)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: active ? '#D4AF37' : 'rgba(255,255,255,0.08)',
                  transform: active ? 'none' : 'translateX(4px)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: active ? '#1F2937' : '#D4AF37', // Gold icons for inactive state
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: active ? 800 : 500,
                  fontSize: 14,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Logout at bottom */}
      <List sx={{ px: 2, pb: 3 }}>
        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: '16px',
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            '&:hover': {
              bgcolor: '#ef4444',
              color: 'white',
              '& .MuiListItemIcon-root': { color: 'white' },
            },
          }}
        >
          <ListItemIcon sx={{ color: '#ef4444', minWidth: 40 }}>
            <Logout />
          </ListItemIcon>
          <ListItemText primary='Logout' primaryTypographyProps={{ fontWeight: 700 }} />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box
      component='nav'
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      <Drawer
        variant='temporary'
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            bgcolor: '#1F2937',
            borderRight: '1px solid rgba(212, 175, 55, 0.1)',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant='permanent'
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            bgcolor: '#1F2937',
            borderRight: '2px solid rgba(212, 175, 55, 0.1)',
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