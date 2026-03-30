import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import LoadingSpinner from '../common/LoadingSpinner';
import { Box, IconButton, AppBar, Toolbar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { message } from 'antd';
import { useAuth } from '../../lib/context/AuthContext';
import { tasksApi } from '../../lib/services/api/task.api';

const drawerWidth = 280;

const MainLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (!user || user.role === 'admin') return;
    if (toastShownRef.current) return;
    const managerId = user.id ?? user._id ?? '';
    if (!managerId) return;
    const storageKey = `zz_task_last_seen_${managerId}`;
    const lastSeen = localStorage.getItem(storageKey) ?? new Date(0).toISOString();
    tasksApi
      .getNewAssignmentsSince(managerId, lastSeen)
      .then((newTasks) => {
        if (newTasks.length > 0) {
          message.info(
            `${newTasks.length} new task${newTasks.length > 1 ? 's' : ''} assigned to you.`,
          );
        }
        localStorage.setItem(storageKey, new Date().toISOString());
        toastShownRef.current = true;
      })
      .catch(() => {
        toastShownRef.current = true;
      });
  }, [user]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f9fafb' }}>
      {/* Mobile App Bar */}
      <AppBar
        position='fixed'
        sx={{
          display: { sm: 'none' },
          width: '100%',
          bgcolor: '#1F2937',
          zIndex: 1100, // Ensure it's above the drawer if needed, though usually drawer is higher
        }}
      >
        <Toolbar>
          <IconButton
            color='inherit'
            aria-label='open drawer'
            edge='start'
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' }, color: '#D4AF37' }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />

      <Box
        component='main'
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: '64px', sm: 0 }, // Add margin top for mobile app bar
          overflow: 'auto',
        }}
      >
        <Suspense fallback={<LoadingSpinner />}>
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  );
};

export default MainLayout;
