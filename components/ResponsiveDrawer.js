'use client'
import * as React from 'react';
import PropTypes from 'prop-types';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import { Button } from '@mui/material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MailIcon from '@mui/icons-material/Mail';
import MenuIcon from '@mui/icons-material/Menu';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import PaymentsIcon from '@mui/icons-material/Payments';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import HomeIcon from '@mui/icons-material/Home';
import { SignedOut, SignedIn, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';

const drawerWidth = 240;

function ResponsiveDrawer(props) {
  const { window } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const { user } = useUser();

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  const drawer = (
    <div>
      <Toolbar />
     <List>
     <ListItem >
     <SignedOut>
      <Link href="/sign-in" passHref>
         <Button color="inherit">Sign In</Button>
      </Link>
      <Link href="/sign-up" passHref>
        <Button color="inherit">Sign Up</Button>
      </Link>
      </SignedOut>
      <SignedIn> 
        <UserButton />
        {/* make a new line */}
        {user ? (
        <Typography>{user.firstName} {user.lastName}</Typography>
        ) : (
        <Typography>Loading...</Typography> // Optionally display a loading message
        )}
      </SignedIn>
      </ListItem>
     </List>
      <Divider />
      <List>
  

  {/*Dashboard*/}
<List>
<ListItem disablePadding>
    <Link href="/" passHref>
      <ListItemButton >
        <ListItemIcon>
          <InventoryIcon />
        </ListItemIcon>
        <ListItemText primary="Dashboard" />
      </ListItemButton>
    </Link>
  </ListItem>
  </List>
  <Divider />


  <ListItem disablePadding>
    <Link href="/inventory" passHref>
      <ListItemButton >
        <ListItemIcon>
          <InventoryIcon />
        </ListItemIcon>
        <ListItemText primary="Inventory" />
      </ListItemButton>
    </Link>
  </ListItem>
  </List>
      {/* <List>
        {['Dashboard', 'Inventory'].map((text, index) => (
          <ListItem key={text} disablePadding>
            <ListItemButton>
              <ListItemIcon>
                {index % 2 === 0 ? <HomeIcon /> : <InventoryIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List> */}
      <Divider />
    <List>
      <ListItem disablePadding>
        <Link href="/expenses" passHref>
          <ListItemButton>
            <ListItemIcon>
              <PaymentsIcon />
            </ListItemIcon>
            <ListItemText primary="Expenses" />
          </ListItemButton>
        </Link>
      </ListItem>

      <ListItem disablePadding>
        <Link href="/sales" passHref>
          <ListItemButton>
            <ListItemIcon>
              <PointOfSaleIcon />
            </ListItemIcon>
            <ListItemText primary="Sales" />
          </ListItemButton>
        </Link>
      </ListItem>
    </List>
      <Divider />
    <List>
      <ListItem disablePadding>
        <Link href="/contact" passHref>
          <ListItemButton>
            <ListItemIcon>
              <PaymentsIcon />
            </ListItemIcon>
            <ListItemText primary="Contact us" />
          </ListItemButton>
        </Link>
      </ListItem>





      {/* <ListItem disablePadding>
        <Link href="/sales" passHref>
          <ListItemButton>
            <ListItemIcon>
              <PointOfSaleIcon />
            </ListItemIcon>
            <ListItemText primary="Sales" />
          </ListItemButton>
        </Link>
      </ListItem> */}
    </List>
    </div>
  );

  // Remove this const when copying and pasting into your project.
  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onTransitionEnd={handleDrawerTransitionEnd}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
    </Box>
  );
}

// ResponsiveDrawer.propTypes = {
//   /**
//    * Injected by the documentation to work in an iframe.
//    * Remove this when copying and pasting into your project.
//    */
//   window: PropTypes.func,
// };

export default ResponsiveDrawer;
