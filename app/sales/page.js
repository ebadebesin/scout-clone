"use client";

import { useState, useEffect } from 'react';
import {  
    Box, Container, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Fab, Modal, TextField, Button, Snackbar 
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import ResponsiveDrawer from '@/components/ResponsiveDrawer';
import Export from '@/components/SalesExport'
import ChatSupport from '@/components/chatsupport';
import { useUser } from '@clerk/nextjs';
import { doc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase';
import { format, isValid } from 'date-fns';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator

export default function Sales() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [sales, setSales] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);

  const [filteredSales, setFilteredSales] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // State for managing search query

  const [itemName, setItemName] = useState('');
  const [size, setSize] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Fetch sales data from the 'sales' subcollection
const displaySales = async () => {
    if (!isLoaded || !isSignedIn || !user) {
      alert('You must be signed in to view your sales.');
      return;
    }
  
    try {
      const salesCollectionRef = collection(db, 'users', user.id, 'sales');
      const salesSnapshot = await getDocs(salesCollectionRef);
  
      const soldItems = salesSnapshot.docs.map(doc => doc.data());
  
      // Ensure each sold item has a valid date before setting state
      const validatedSales = soldItems.map(item => ({
        ...item,
        soldDate: isValid(new Date(item.soldDate)) ? item.soldDate : null,
      }));
  
      setSales(validatedSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
      alert('An error occurred while fetching your sales. Please try again.');
    }
  };

  // Filter the inventory based on the search query
  // const filteredInventory = pantry.filter(
  //   (item) =>
  //     item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     item.SKU.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  // Filter the inventory based on the search query
  useEffect(() => {
    setFilteredSales(
      sales.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.SKU.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, sales]);

  // Fetch sales on component mount or when the user changes
  useEffect(() => {
    if (user) {
      displaySales();
    }
  }, [user]);

  // Add new sale
  const addSale = async () => {
    if (!isLoaded || !isSignedIn || !user) {
      alert('You must be signed in to add a sale.');
      return;
    }

    // Ensure date is valid
    const parsedDate = new Date(date);
    if (!isValid(parsedDate)) {
      alert("Please select a valid sale date.");
      return;
    }

    const saleData = {
      id: uuidv4(), // Generate unique ID
      name: itemName,
      size: size,
      SKU: sku,
      purchasePrice: price,
      soldDate: parsedDate.toISOString(), // Ensure valid ISO format date
    };

    try {
      const userDocRef = doc(collection(db, 'users'), user.id);
      const batch = writeBatch(db);

      // Add the sale to the user's sales collection
      const salesDocRef = doc(collection(userDocRef, 'sales'), saleData.id);
      batch.set(salesDocRef, saleData);

      await batch.commit();
      setOpenDialog(false); // Close the modal after successful add
      setSnackbarMessage('Sale added successfully!');
      setSnackbarOpen(true);
      displaySales(); // Refresh the sales list after adding
    } catch (error) {
      console.error('Error adding sale:', error);
      alert('An error occurred while adding the sale. Please try again.');
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
        <Typography variant="h3" sx={{ marginBottom: 2 }}>Sales</Typography>

        {/* Export Button */}
        <Fab color="primary"
          aria-label="add"
          sx={{ position: 'fixed', top: 16, right: 80 }}>
                <Export filteredSales={filteredSales} />
        </Fab>

        <TableContainer component={Paper}>
          {sales.length === 0 ? (
            <Box textAlign="center" p={5}>
              <Typography variant="h4">No sales found</Typography>
              <Typography variant="body1">Items marked as sold will appear here.</Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Sale Price</TableCell>
                  <TableCell>Sale Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.SKU}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell>${Number(item.purchasePrice).toFixed(2)}</TableCell>
                    <TableCell>
                      {item.soldDate ? format(new Date(item.soldDate), 'MMM dd, yyyy') : 'Invalid date'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {/* Add Sale Button */}
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', top: 16, right: 16 }}
          onClick={() => setOpenDialog(true)} // Open the modal
        >
          <AddIcon />
        </Fab>

        {/* Modal for adding a sale */}
        <Modal open={openDialog} onClose={() => setOpenDialog(false)}>
          <Box
            sx={{
              padding: '20px',
              backgroundColor: 'white',
              margin: '100px auto',
              maxWidth: '650px',
              borderRadius: '8px',
              boxShadow: 24,
            }}
          >
            <Typography variant="h6" sx={{ marginBottom: '20px' }}>Add New Sale</Typography>
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
                  placeholder="e.g., 10"
                  helperText="e.g., 10"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  sx={{ minWidth: '250px', marginBottom: '10px' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  label="SKU"
                  fullWidth
                  placeholder="e.g., 1234"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  sx={{ minWidth: '300px', marginBottom: '10px' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  label="Sale Price"
                  fullWidth
                  placeholder="e.g., 100"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  sx={{ marginBottom: '10px' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  label="Sale Date"
                  fullWidth
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  InputLabelProps={{ shrink: true }} // Keeps label static
                  sx={{ minWidth: '300px', marginBottom: '10px' }}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button onClick={() => setOpenDialog(false)} sx={{ marginRight: '10px' }}>Cancel</Button>
              <Button variant="contained" color="primary" onClick={addSale}>
                Add
              </Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    </Box>
  );
}