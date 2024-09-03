"use client";

import { useState, useEffect } from 'react';
import {
  Box, Container, Typography, TextField, Select, MenuItem, Modal, Checkbox,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Grid, IconButton, Fab, Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ResponsiveDrawer from '@/components/ResponsiveDrawer';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { SignedOut, SignedIn, UserButton } from '@clerk/nextjs';
import { doc, collection, getDoc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase';
import SearchBar from '../components/SearchBar'; // Import SearchBar component

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [pantry, setPantry] = useState([]);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [date, setDate] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [size, setSize] = useState('');

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

  // Update inventory by fetching the latest data
  const updateInventory = async () => {
    await displayInventory(); // Fetch and display the latest inventory
  };

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
  
      const itemDocRef = doc(collection(userDocRef, 'items'), item.SKU);  // Consistent 'SKU'
      batch.set(itemDocRef, itemData);  
      await batch.commit(); 
  
      alert('Item added successfully!');
      await updateInventory(); // Refresh inventory after adding an item
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
  const deleteItem = async (sku) => {
    if (!isLoaded || !isSignedIn || !user) {
      alert('You must be signed in to delete an item.');
      return;
    }

    try {
      const userDocRef = doc(collection(db, 'users'), user.id);
      const itemDocRef = doc(collection(userDocRef, 'items'), sku);

      await deleteDoc(itemDocRef);

      // Update the user's items array in Firestore
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const updatedItems = userData.items.filter(item => item.SKU !== sku);
        await setDoc(userDocRef, { items: updatedItems }, { merge: true });
      }

      alert('Item deleted successfully!');
      await updateInventory(); // Refresh inventory after deletion
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('An error occurred while deleting the item. Please try again.');
    }
  };

  // Filter the inventory based on the search query
  const filteredInventory = pantry.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.SKU.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch inventory on component mount or when the user changes
  useEffect(() => {
    if (user) {
      updateInventory();
    }
  }, [user]);

  const handleAddItemClick = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewItem({ name: itemName, size: size, SKU: sku, purchasePrice: price, purchaseDate: date });
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <ResponsiveDrawer />

      <Box component="main" sx={{ flexGrow: 1, padding: 3, position: 'relative' }}>
        <Typography variant="h4" sx={{ marginBottom: 2 }}>Inventory</Typography>

        <Grid container spacing={2} sx={{ marginBottom: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
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
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Purchase Date</TableCell>
                <TableCell>Purchase Price</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInventory.map((item, index) => (
                <TableRow key={index}>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell>{item.SKU}</TableCell>
                  <TableCell>{item.purchaseDate}</TableCell>
                  <TableCell>{item.purchasePrice}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add Item Button */}
        <Fab 
          color="primary" 
          aria-label="add" 
          sx={{ position: 'fixed', bottom: 16, right: 16 }} 
          onClick={handleAddItemClick}
        >
          <AddIcon />
        </Fab>
        </Box>

{/* Modal for adding an item */}
<Modal open={openDialog} onClose={handleCloseDialog}>
  <Box sx={{ padding: '20px', backgroundColor: 'white', margin: '100px auto', maxWidth: '400px' }}>
    <Typography variant="h6">Add New Item</Typography>
    <TextField
      label="Item Name"
      fullWidth
      value={itemName}
      onChange={(e) => setItemName(e.target.value)}
      sx={{ marginBottom: '10px' }}
    />
    <TextField
      label="Size"
      fullWidth
      value={size}
      onChange={(e) => setSize(e.target.value)}
      sx={{ marginBottom: '10px' }}
    />
    <TextField
      label="SKU"
      fullWidth
      value={sku}
      onChange={(e) => setSku(e.target.value)}
      sx={{ marginBottom: '10px' }}
    />
    <TextField
      label="Purchase Price"
      fullWidth
      value={price}
      type="text"
      onChange={(e) => setPrice(e.target.value)}
      sx={{ marginBottom: '10px' }}
    />
    <TextField
      label="Purchase Date"
      fullWidth
      value={date}
      type="date"
      onChange={(e) => setDate(e.target.value)}
      sx={{ marginBottom: '10px' }}
    />
    <Button onClick={handleCloseDialog}>Cancel</Button>
    <Button
      onClick={() => {
        addItem({ name: itemName, size: size, SKU: sku, purchasePrice: price, purchaseDate: date });
        handleCloseDialog();
      }}
    >
      Add
    </Button>
  </Box>
</Modal>

</Box>
);
}