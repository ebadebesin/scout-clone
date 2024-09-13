'use client'
import { useState, useEffect } from 'react';
import {
  Box, Container, Typography, TextField, Select, MenuItem, Tooltip, Modal, Checkbox,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Fab, Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import { ChatBubble } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ResponsiveDrawer from '@/components/ResponsiveDrawer';
import { useUser } from '@clerk/nextjs';
import { doc, collection, getDoc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase';
import { format } from 'date-fns';
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
  const [newItem, setNewItem] = useState({
    name: '',
    size: '',
    SKU: '',
    purchasePrice: '',
    purchaseDate: '',
    status: '',
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
      const userDocSnap = await getDoc(userDocRef);
      const batch = writeBatch(db);

      let purchaseDate;
      try {
        purchaseDate = new Date(item.purchaseDate).toISOString();
      } catch (error) {
        console.error('Error parsing date:', error);
        purchaseDate = 'Invalid Date';
      }

      const itemData = {
        id: uuidv4(),
        name: item.name,
        size: item.size,
        SKU: item.SKU,
        purchasePrice: item.purchasePrice,
        purchaseDate: purchaseDate,
      };

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const updatedItems = [...(userData.items || []), itemData];
        batch.update(userDocRef, { items: updatedItems });
      } else {
        batch.set(userDocRef, { items: [itemData] });
      }

      const itemDocRef = doc(collection(userDocRef, 'items'), itemData.id);
      batch.set(itemDocRef, itemData);
      await batch.commit();

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
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const items = userData.items || [];
        setPantry(items);
      } else {
        setPantry([]);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      alert('An error occurred while fetching your inventory. Please try again.');
    }
  };

  const deleteItem = async (item) => {
    if (!isLoaded || !isSignedIn || !user) {
      alert('You must be signed in to delete an item.');
      return;
    }

    try {
      const userDocRef = doc(collection(db, 'users'), user.id);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const updatedItems = userData.items.filter(itemE => itemE.id !== item);
        await setDoc(userDocRef, { items: updatedItems }, { merge: true });

        const itemDocRef = doc(collection(userDocRef, 'items'), item);
        await deleteDoc(itemDocRef);

        setPantry(updatedItems);

        setSnackbarMessage('Item deleted successfully!');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('An error occurred while deleting the item. Please try again.');
    }
  };

  const handleAddItemClick = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewItem({ name: itemName, size: size, SKU: sku, purchasePrice: price, purchaseDate: date });
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
                {pantry.map((item, index) => (
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
                          return format(new Date(item.purchaseDate), 'MMM dd, yyyy');
                        } catch (error) {
                          console.error('Error formatting date:', error);
                          return 'Invalid Date';
                        }
                      })()}
                    </TableCell>
                    <TableCell>
                      {/* Edit and Delete buttons */}
                      <Tooltip title="Edit">
                        <IconButton onClick={() => setSelectedItem(item)}>
                          <EditIcon color="primary" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => deleteItem(item.id)}>
                          <DeleteIcon color="error" />
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
                  helperText="e.g., Jordan 1"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Size"
                  fullWidth
                  value={size}
                  helperText="e.g., 10"
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
      </Box>
    </Box>
  );
}
