"use client";

import { useState, useEffect } from 'react';
import {
  Box, Container, Typography, TextField, Select, MenuItem, Tooltip, Modal, Checkbox,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Fab, Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import { ChatBubble } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit'
import ResponsiveDrawer from '@/components/ResponsiveDrawer';
import Export from '@/components/Export'
// import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { doc, collection, getDoc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase';
import SearchBar from '../components/SearchBar'; // Import SearchBar component
import { Snackbar } from '@mui/material';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator
import ChatSupport from '@/components/chatsupport';

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [pantry, setPantry] = useState([]);
  // const router = useRouter();
  // const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [date, setDate] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [size, setSize] = useState('');

  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // State for managing search query
  const [statusFilter, setStatusFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState('All');
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

  const handleSnackbarClose = () => {
        setSnackbarOpen(false);
  };

  const [selectedItem, setSelectedItem] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);


  // // Update inventory by fetching the latest data
  // const updateInventory = async () => {
  //   await displayInventory(); // Fetch and display the latest inventory
  // };

  // Add item to the user's inventory
  const addItem = async (item) => {
    if (!isLoaded || !isSignedIn || !user) {
      alert('You must be signed in to add an item.');
      return;
    }
    try {
      const userDocRef = doc(collection(db, 'users'), user.id);
      const userDocSnap = await getDoc(userDocRef);
      const batch = writeBatch(db); 
  
      const itemData = {
        id: uuidv4(), //generate a unique ID for each item
        name: item.name,
        size: item.size,
        SKU: item.SKU,  // Ensure 'SKU' is consistent
        purchasePrice: item.purchasePrice,
        purchaseDate: item.purchaseDate,
      };
  
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const updatedItems = [...(userData.items || []), itemData];
        batch.update(userDocRef, { items: updatedItems });
      } else {
        batch.set(userDocRef, { items: [itemData] });
      }
  
      const itemDocRef = doc(collection(userDocRef, 'items'), itemData.id);  // Consistent 'SKU'
      batch.set(itemDocRef, itemData);  
      await batch.commit(); 
  
      // alert('Item added successfully!');
      setSnackbarMessage('Item added successfully!');
      setSnackbarOpen(true);

      await displayInventory(); // Refresh inventory after adding an item
    } catch (error) {
      console.error('Error adding item:', error);
      alert('An error occurred while adding the item. Please try again.');
    }
  };

  // Get and display the user's inventory
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
        setPantry(items); // Set pantry state to display inventory in UI

        if (items.length === 0) {
          console.log('No items in your inventory.');
        } else {
          console.log('Inventory:', items);
        }
      } else {
        console.log('No inventory found for this user.');
        setPantry([]); // Clear pantry state if no inventory
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      alert('An error occurred while fetching your inventory. Please try again.');
    }
  };

  // Delete an item from the user's inventory
  const deleteItem = async (item) => {
    if (!isLoaded || !isSignedIn || !user) {
      alert('You must be signed in to delete an item.');
      return;
    }

    try {
      const userDocRef = doc(collection(db, 'users'), user.id);
      // Update the user's items array in Firestore
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const updatedItems = userData.items.filter(itemE => itemE.name !== item);
        await setDoc(userDocRef, { items: updatedItems }, { merge: true });

       const itemDocRef = doc(collection(userDocRef, 'items'), item);
       await deleteDoc(itemDocRef);

       setPantry(updatedItems);

        setSnackbarMessage('Item deleted successfully!');
        setSnackbarOpen(true);

      }

      // alert('Item deleted successfully!');
      // await displayInventory(); // Refresh inventory after deletion
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('An error occurred while deleting the item. Please try again.');
    }
  };

  ///////////////edit
  const editItem = async (itemId, updatedItem) => {
    if (!isLoaded || !isSignedIn || !user) {
    alert('You must be signed in to edit an item.');
    return;
    }

    try {
    const userDocRef = doc(db, 'users', user.id);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const updatedItems = userData.items.map((item) =>
        item.id === itemId ? updatedItem : item
        );

        // Update the Firestore document
        await setDoc(userDocRef, { items: updatedItems }, { merge: true });

        // Update individual item document
        const itemDocRef = doc(collection(userDocRef, 'items'), itemId);
        await setDoc(itemDocRef, updatedItem, { merge: true });

        // Update local state
        setPantry(updatedItems);
        setSnackbarMessage('Item edited successfully!');
        setSnackbarOpen(true);
        await displayInventory(); // Refresh the item list after editing
    }
    } catch (error) {
    console.error('Error editing Item:', error);
    alert('An error occurred while editing the Item. Please try again.');
    }
  };

  // // Filter the inventory based on the search query
  // const filteredInventory = pantry.filter(
  //   (item) =>
  //     item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     item.SKU.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  // Filter the inventory based on the search query
  useEffect(() => {
    setFilteredInventory(
      pantry.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.SKU.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, pantry]);

  // Fetch inventory on component mount or when the user changes
  useEffect(() => {
    if (user) {
      displayInventory();
    }
  }, [user]);

  const handleAddItemClick = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewItem({ name: itemName, size: size, SKU: sku, purchasePrice: price, purchaseDate: date });
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setEditDialogOpen(true);
  };

  // Mark item as sold function:
  const markAsSold = async (item) => {
    if (!isLoaded || !isSignedIn || !user) {
      alert('You must be signed in to mark an item as sold.');
      return;
    }
  
    try {
      const userDocRef = doc(collection(db, 'users'), user.id);
      const userDocSnap = await getDoc(userDocRef);
      const batch = writeBatch(db);
  
      // Remove the item from the inventory
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const updatedItems = userData.items.filter((inventoryItem) => inventoryItem.id !== item.id);
        batch.update(userDocRef, { items: updatedItems });
  
        // Add the item to the sales collection
        const salesDocRef = doc(collection(db, 'users', user.id, 'sales'), item.id);
        batch.set(salesDocRef, { ...item, soldDate: new Date().toISOString() });
  
        await batch.commit();
  
        setSnackbarMessage('Item marked as sold and moved to sales!');
        setSnackbarOpen(true);
  
        // Refresh inventory after marking an item as sold
        await displayInventory();
      }
    } catch (error) {
      console.error('Error marking item as sold:', error);
      alert('An error occurred while marking the item as sold. Please try again.');
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <ResponsiveDrawer />
      <ChatSupport/>
      <Snackbar
                  open={snackbarOpen}
                  autoHideDuration={6000}
                  onClose={handleSnackbarClose}
                  message={snackbarMessage}
      />
      <Box component="main" sx={{ flexGrow: 1, padding: 3, position: 'relative' }}>
       <Typography variant="h3" sx={{ marginBottom: 2 }}>Inventory</Typography>

       <Fab color="primary"
          aria-label="add"
          sx={{ position: 'fixed', top: 16, right: 80 }}>
                <Export filteredInventory={filteredInventory} />
        </Fab>

        <Grid container spacing={2} sx={{ marginBottom: 2 }}>
          <Grid item= "true" xs={12} sm={6} md={3}>
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </Grid>
          {/* <Grid item xs={6} sm={3} md={2}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              fullWidth
            >
              <MenuItem value="All">Status: All</MenuItem>
              <MenuItem value="Listed">Listed</MenuItem>
              <MenuItem value="Unlisted">Unlisted</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <Select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              fullWidth
            >
              <MenuItem value="All">Platform: All</MenuItem>
              <MenuItem value="StockX">StockX</MenuItem>
              <MenuItem value="GOAT">GOAT</MenuItem>
            </Select>
          </Grid> */}

        </Grid>

        <TableContainer component={Paper}>
        {pantry.length === 0 ? (
        <Box textAlign="center" p={5}>
            <Typography variant="h4">No item found</Typography>
            <Typography variant="body1">Click -
                <Fab
                    color="primary"
                    aria-label="add"
                    size='small'
                    onClick={handleAddItemClick}
                >
                    <AddIcon />
                </Fab> 
                
                - to get started.</Typography>
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
                <TableCell> Edit</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredInventory.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.SKU}</TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell>${Number(item.purchasePrice).toFixed(2)}</TableCell>
                  <TableCell>{format(new Date(item.purchaseDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    {/* Edit button */}
                    <Tooltip title= "Edit">
                    <IconButton onClick={() => handleEditClick(item)}>
                    <EditIcon color="primary" />
                    </IconButton>
                    </Tooltip>

                    {/* Delete button */}  
                    <Tooltip title= "Delete">
                    <IconButton onClick={() => deleteItem(item.name)}>
                    <DeleteIcon color="error" />
                    </IconButton> 
                    </Tooltip>

                    {/*Mark Sold Button */}
                    <IconButton onClick={() => markAsSold(item)}>
                    <Tooltip title="Mark as Sold"> 
                    <Typography variant="h6" color="green">$</Typography>
                    </Tooltip>
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        </TableContainer>

        {/* Add Item Button */}
        <Fab 
          color="primary" 
          aria-label="add" 
          sx={{ position: 'fixed', top: 16, right: 16 }} 
          onClick={handleAddItemClick}
        >
          <AddIcon />
        </Fab>

        </Box>

        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Item</DialogTitle>
        <DialogContent>
            <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <TextField
                label="Item Name"
                fullWidth
                value={selectedItem?.name || ''}
                onChange={(e) =>
                    setSelectedItem({ ...selectedItem, name: e.target.value })
                }
                />
            </Grid>

            <Grid item xs={12} sm={6}>
                <TextField
                label="Purchase Date"
                fullWidth
                type='date'
                InputLabelProps={{ shrink: true }} // Keeps label static
                value={selectedItem?.purchaseDate || ''}
                onChange={(e) =>
                    setSelectedItem({ ...selectedItem, purchaseDate: e.target.value })
                }
                />
            </Grid>
            
            <Grid item xs={12} sm={6}>
                <TextField
                label="Size"
                fullWidth
                InputLabelProps={{ shrink: true }} // Keeps label static
                value={selectedItem?.size || ''}
                onChange={(e) =>
                    setSelectedItem({ ...selectedItem, size: e.target.value })
                }
                />
            </Grid>
            {/* Other fields like purchasePrice, , etc. */}
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
            onClick={() => {
                editItem(selectedItem.id, selectedItem);
                setEditDialogOpen(false);
            }}
            color="primary"
            variant="contained"
            >
            Save Changes
            </Button>
        </DialogActions>
    </Dialog>

{/* Modal for adding an item */}
  <Modal open={openDialog} onClose={handleCloseDialog}>
  <Box  sx={{
            padding: '20px',
            backgroundColor: 'white',
            margin: '100px auto',
            maxWidth: '650px', // Increased maxWidth for two columns
            borderRadius: '8px', // Curved borders
            boxShadow: 24, // Optional: adds a shadow for visual enhancement
            }}>
    <Typography variant="h6" sx={{ marginBottom: '20px' }}>Add New Item</Typography>
    
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          required
          label="Item Name"
          fullWidth
          placeholder="Enter the name of the item"
          helperText="e.g., Jordan 1"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          sx={{ minWidth: '300px', marginBottom: '10px' }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="Size"
          fullWidth
          value={size}
          helperText="e.g., 10"
          onChange={(e) => setSize(e.target.value)}
          sx={{ minWidth: '250px', marginBottom: '10px' }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          required
          label="SKU"
          fullWidth
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          helperText="if not available, 000000"
          sx={{ minWidth: '300px', marginBottom: '10px' }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          required
          label="Purchase Price"
          fullWidth
          placeholder="0.00 "
          helperText="e.g., 100"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          sx={{ marginBottom: '10px' }}
          
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          required
          label="Purchase Date"
          fullWidth
          value={date}
          type="date"
          onChange={(e) => setDate(e.target.value)}
          sx={{ minWidth: '300px', marginBottom: '10px' }}
          InputLabelProps={{ shrink: true }} // Keeps label static
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
);
}