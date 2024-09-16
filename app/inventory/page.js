'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Tooltip, Modal, Checkbox,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Fab, Snackbar, Button, Dialog, DialogActions, DialogContent, DialogTitle
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SellIcon from '@mui/icons-material/ShoppingCartCheckout';
import ResponsiveDrawer from '@/components/ResponsiveDrawer';
import { useUser } from '@clerk/nextjs';
import { doc, collection, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { v4 as uuidv4 } from 'uuid';
import ChatSupport from '@/components/chatsupport';

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [pantry, setPantry] = useState([]);
  const [itemName, setItemName] = useState('');
  const [date, setDate] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [size, setSize] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [soldDialogOpen, setSoldDialogOpen] = useState(false); // State for sold dialog
  const [selectedItem, setSelectedItem] = useState(null);
  const [salePrice, setSalePrice] = useState(''); // State for sale price
  const [saleDate, setSaleDate] = useState(''); // State for sale date
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const addItem = async (item) => {
    if (!isLoaded || !isSignedIn || !user) {
      alert('You must be signed in to add an item.');
      return;
    }

    try {
      const userDocRef = doc(collection(db, 'users'), user.id);
      const itemDocRef = doc(collection(userDocRef, 'items'), uuidv4());

      let purchaseDate;
      try {
        purchaseDate = new Date(item.purchaseDate).toISOString(); // Store as ISO format
      } catch (error) {
        console.error('Error parsing date:', error);
        purchaseDate = 'Invalid Date';
      }

      const itemData = {
        id: itemDocRef.id,
        name: item.name,
        size: item.size,
        SKU: item.SKU,
        purchasePrice: isNaN(parseFloat(item.purchasePrice)) ? 0 : parseFloat(item.purchasePrice),
        purchaseDate: purchaseDate,
      };

      await setDoc(itemDocRef, itemData);

      setSnackbarMessage('Item added successfully!');
      setSnackbarOpen(true);

      await displayInventory();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('An error occurred while adding the item. Please try again.');
    }
  };

  const displayInventory = async () => {
    if (!isLoaded || !isSignedIn || !user) {
      alert('You must be signed in to view your inventory.');
      return;
    }

    try {
      const userDocRef = doc(collection(db, 'users'), user.id);
      const itemsCollectionRef = collection(userDocRef, 'items');
      const itemsSnapshot = await getDocs(itemsCollectionRef);

      const items = itemsSnapshot.docs.map(doc => doc.data());
      setPantry(items);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      alert('An error occurred while fetching your inventory. Please try again.');
    }
  };

  const deleteItem = async (itemId) => {
    if (!isLoaded || !isSignedIn || !user) {
      alert('You must be signed in to delete an item.');
      return;
    }

    try {
      const userDocRef = doc(collection(db, 'users'), user.id);
      const itemDocRef = doc(collection(userDocRef, 'items'), itemId);

      await deleteDoc(itemDocRef);
      setPantry(prev => prev.filter(item => item.id !== itemId));

      setSnackbarMessage('Item deleted successfully!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('An error occurred while deleting the item. Please try again.');
    }
  };

  // Handle the "Mark as Sold" process
  const markAsSold = async () => {
    if (!isLoaded || !isSignedIn || !user || !selectedItem) return;

    try {
      const userDocRef = doc(collection(db, 'users'), user.id);
      const itemDocRef = doc(collection(userDocRef, 'items'), selectedItem.id);
      const itemDocSnap = await getDoc(itemDocRef);

      if (itemDocSnap.exists()) {
        const itemData = {
          ...itemDocSnap.data(),
          salePrice: salePrice,  // Get sale price from dialog input
          saleDate: new Date(saleDate).toISOString(),  // Get sale date from dialog input
        };

        // Move item to the "sales" sub-collection
        const salesDocRef = doc(collection(userDocRef, 'sales'), selectedItem.id);
        await setDoc(salesDocRef, itemData);

        // Delete the item from the "items" collection
        await deleteDoc(itemDocRef);

        setSnackbarMessage('Item marked as sold!');
        setSnackbarOpen(true);
        setSoldDialogOpen(false);
        displayInventory();
      } else {
        alert('Item not found.');
      }
    } catch (error) {
      console.error('Error marking item as sold:', error);
      alert('An error occurred while marking the item as sold. Please try again.');
    }
  };

  const handleSoldDialogOpen = (item) => {
    setSelectedItem(item); // Set the item being marked as sold
    setSalePrice(''); // Reset sale price
    setSaleDate(''); // Reset sale date
    setSoldDialogOpen(true); // Open the sold dialog
  };

  const handleAddItemClick = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setItemName('');
    setSize('');
    setSku('');
    setPrice('');
    setDate('');
  };

  const handleEditDialogOpen = (item) => {
    setSelectedItem(item);
    setItemName(item.name);
    setSize(item.size);
    setSku(item.SKU);
    setPrice(item.purchasePrice);
    setDate(item.purchaseDate);
    setEditDialogOpen(true);
  };

  const handleEditItem = async () => {
    if (!isLoaded || !isSignedIn || !user || !selectedItem) return;

    try {
      const userDocRef = doc(collection(db, 'users'), user.id);
      const itemDocRef = doc(collection(userDocRef, 'items'), selectedItem.id);

      await setDoc(itemDocRef, {
        ...selectedItem,
        name: itemName,
        size: size,
        SKU: sku,
        purchasePrice: price,
        purchaseDate: new Date(date).toISOString(),
      });

      setSnackbarMessage('Item updated successfully!');
      setSnackbarOpen(true);
      setEditDialogOpen(false);
      displayInventory();
    } catch (error) {
      console.error('Error editing item:', error);
      alert('An error occurred while editing the item. Please try again.');
    }
  };

  useEffect(() => {
    if (user) {
      displayInventory();
    }
  }, [user]);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <ResponsiveDrawer />
      <ChatSupport />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
      <Box component="main" sx={{ flexGrow: 1, padding: 3, position: 'relative' }}>
        <Typography variant="h4" sx={{ marginBottom: 2 }}>Inventory</Typography>

        <TableContainer component={Paper}>
          {pantry.length === 0 ? (
            <Box textAlign="center" p={5}>
              <Typography variant="h4">No item found</Typography>
              <Typography variant="body1">
                Click -
                <Fab
                  color="primary"
                  aria-label="add"
                  size="small"
                  onClick={handleAddItemClick}
                >
                  <AddIcon />
                </Fab>
                - to get started.
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Purchase Price</TableCell>
                  <TableCell>Purchase Date</TableCell>
                  <TableCell>Edit</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {pantry.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell padding="checkbox">
                      <Checkbox />
                    </TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.SKU}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell>${Number(item.purchasePrice).toFixed(2)}</TableCell>
                    <TableCell>
                      {(() => {
                        try {
                          return new Date(item.purchaseDate).toISOString().slice(0, 10);
                        } catch (error) {
                          console.error('Error formatting date:', error);
                          return 'Invalid Date';
                        }
                      })()}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleEditDialogOpen(item)}>
                          <EditIcon color="primary" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => deleteItem(item.id)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Mark as Sold">
                        <IconButton onClick={() => handleSoldDialogOpen(item)}>
                          <SellIcon color="success" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', top: 16, right: 16 }}
          onClick={handleAddItemClick}
        >
          <AddIcon />
        </Fab>

        {/* Modal for adding an item */}
        <Modal open={openDialog} onClose={handleCloseDialog}>
          <Box sx={{ padding: '20px', backgroundColor: 'white', margin: '100px auto', maxWidth: '650px', borderRadius: '8px', boxShadow: 24 }}>
            <Typography variant="h6" sx={{ marginBottom: '20px' }}>Add New Item</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Item Name"
                  fullWidth
                  placeholder="Enter the name of the item"
                  helperText="e.g., Jordan 1 (green)"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Size"
                  fullWidth
                  value={size}
                  helperText="e.g., 10 or S/M"
                  onChange={(e) => setSize(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="SKU"
                  fullWidth
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Purchase Price"
                  fullWidth
                  placeholder="0.00"
                  helperText="e.g., 100"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Purchase Date"
                  fullWidth
                  value={date}
                  type="date"
                  onChange={(e) => setDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button onClick={handleCloseDialog} sx={{ marginRight: '10px' }}>Cancel</Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  addItem({ name: itemName, size: size, SKU: sku, purchasePrice: price, purchaseDate: date });
                  handleCloseDialog();
                }}
              >
                Add
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Dialog for marking item as sold */}
        <Dialog open={soldDialogOpen} onClose={() => setSoldDialogOpen(false)}>
          <DialogTitle>Mark as Sold</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Sale Price"
                  fullWidth
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Sale Date"
                  fullWidth
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSoldDialogOpen(false)}>Cancel</Button>
            <Button onClick={markAsSold} variant="contained" color="primary">
              Mark as Sold
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal for editing an item */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Item Name"
                  fullWidth
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Size"
                  fullWidth
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="SKU"
                  fullWidth
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Purchase Price"
                  fullWidth
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Purchase Date"
                  fullWidth
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditItem} variant="contained" color="primary">
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
