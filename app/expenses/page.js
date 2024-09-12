"use client";

import { useState, useEffect } from 'react';
import {
  Box, Container, Typography, TextField, Select, MenuItem, Modal, Checkbox,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
   IconButton, Fab, Dialog, DialogTitle, DialogContent, DialogActions, Button,
   Tooltip
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit'
import { Snackbar } from '@mui/material';
import ResponsiveDrawer from '@/components/ResponsiveDrawer';
import ChatSupport from '@/components/chatsupport';
// import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { doc, collection, getDoc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/firebase';
import SearchBar from '@/components/SearchBar'; // Import SearchBar component
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator


export default function Home() {
    const { isLoaded, isSignedIn, user } = useUser();
    const [expenses, setExpenses] = useState([]);
    // const router = useRouter();
    const [openDialog, setOpenDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    // const [statusFilter, setStatusFilter] = useState('All');
    // const [platformFilter, setPlatformFilter] = useState('All');
  
    // Fields for new expense
    const [itemName, setItemName] = useState('');
    const [date, setDate] = useState('');
    const [price, setPrice] = useState('');
    const [tax, setTax] = useState('');
    const [shipping, setShipping] = useState('');
    const [quantity, setQuantity] = useState('');
    const [total, setTotal] = useState('');

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };

    const [selectedExpense, setSelectedExpense] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

/////////////// Add item to the user's inventory
  const addItem = async (item) => {
    if (!isLoaded || !isSignedIn || !user) {
      alert('You must be signed in to add an expense.');
      return;
    }
    try {
        const totalPrice = (
            (parseFloat(item.purchasePrice || 0) + parseFloat(item.tax || 0) + parseFloat(item.shipping || 0)) *
            parseInt(item.quantity || 1)
        ).toFixed(2);

      const expenseData = {
        id: uuidv4(), // Generate a unique ID for each expense
        name: item.name,
        tax: item.tax,
        shipping: item.shipping,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        purchaseDate: item.purchaseDate,
        totalPrice: totalPrice,
      };

      const userDocRef = doc(collection(db, 'users'), user.id);
      const userDocSnap = await getDoc(userDocRef);
      const batch = writeBatch(db);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const updatedExpenses = [...(userData.expenses || []), expenseData];
        batch.update(userDocRef, { expenses: updatedExpenses });
      } else {
        batch.set(userDocRef, { expenses: [expenseData] });
      }

      const expenseDocRef = doc(collection(userDocRef, 'expenses'),expenseData.id);
      batch.set(expenseDocRef, expenseData);
      await batch.commit();

    //   alert('Expense added successfully!');
    setSnackbarMessage('Expense added successfully!');
    setSnackbarOpen(true);
    await displayExpenses(); // Refresh the expense list after adding
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('An error occurred while adding the expense. Please try again.');
    }
  };


///////////////////delete
    const deleteExpense = async (item) => {
    if (!isLoaded || !isSignedIn || !user) {
        alert('You must be signed in to delete an expense.');
        return;
    }

    try {
        const userDocRef = doc(db, 'users', user.id);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const updatedExpenses = userData.expenses.filter(
            (expense) => expense.name !== item
        );

        // Update user document with the new expenses array
        await setDoc(userDocRef, { expenses: updatedExpenses }, { merge: true });

        // Remove individual expense document from the collection
        const expenseDocRef = doc(collection(userDocRef, 'expenses'), item);
        await deleteDoc(expenseDocRef);

        // Update local state
        setExpenses(updatedExpenses);
        setSnackbarMessage('Expense deleted successfully!');
        setSnackbarOpen(true);
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
        alert('An error occurred while deleting the expense. Please try again.');
    }
    };


///////////////edit
    const editExpense = async (expenseId, updatedItem) => {
        if (!isLoaded || !isSignedIn || !user) {
        alert('You must be signed in to edit an expense.');
        return;
        }
    
        try {
        const userDocRef = doc(db, 'users', user.id);
        const userDocSnap = await getDoc(userDocRef);
    
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const updatedExpenses = userData.expenses.map((expense) =>
            expense.id === expenseId ? updatedItem : expense
            );
    
            // Update the Firestore document
            await setDoc(userDocRef, { expenses: updatedExpenses }, { merge: true });
    
            // Update individual expense document
            const expenseDocRef = doc(collection(userDocRef, 'expenses'), expenseId);
            await setDoc(expenseDocRef, updatedItem, { merge: true });
    
            // Update local state
            setExpenses(updatedExpenses);
            setSnackbarMessage('Expense edited successfully!');
            setSnackbarOpen(true);
            await displayExpenses(); // Refresh the expense list after editing
        }
        } catch (error) {
        console.error('Error editing expense:', error);
        alert('An error occurred while editing the expense. Please try again.');
        }
    };
  


/////////////////display
  const displayExpenses = async () => {
    if (!isLoaded || !isSignedIn || !user) {
      alert('You must be signed in to view your expenses.');
      return;
    }

    try {
      const userDocRef = doc(collection(db, 'users'), user.id);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const expensesList = userData.expenses || [];
        setExpenses(expensesList);

        if (expensesList.length === 0) {
          console.log('No expenses found.');
        } else {
          console.log('Expenses:', expensesList);
        }
      } else {
        console.log('No expenses found for this user.');
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      alert('An error occurred while fetching your expenses. Please try again.');
    }
  };

///////////// search/filter  
  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.purchasePrice.toString().includes(searchQuery)
  );

  useEffect(() => {
    if (user) {
      displayExpenses();
    }
  }, [user]);

  useEffect(() => {
    const calculatedTotal = (
      (parseFloat(price || 0) + parseFloat(tax || 0) + parseFloat(shipping || 0)) *
      parseInt(quantity || 1)
    ).toFixed(2);
    setTotal(calculatedTotal);
  }, [price, tax, shipping, quantity]);

  
  const handleAddItemClick = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleEditClick = (expense) => {
    setSelectedExpense(expense);
    setEditDialogOpen(true);
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
        <Typography variant="h3" sx={{ marginBottom: 2 }} >Expenses</Typography>

        <Grid container spacing={2} sx={{ marginBottom: 2 }}>
          <Grid item="true" xs={12} sm={6} md={3}>
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </Grid>

          {/* <Grid item xs={6} sm={3} md={2}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              fullWidth
            >
              <MenuItem value="All">Status: All</MenuItem>
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Unpaid">Unpaid</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <Select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              fullWidth
            >
              <MenuItem value="All">Platform: All</MenuItem>
              <MenuItem value="Bank">Bank</MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
            </Select>
          </Grid> */}

        </Grid>

        <TableContainer component={Paper}>
        {expenses.length === 0 ? (
        <Box textAlign="center" p={5}>
            <Typography variant="h4">No expense found</Typography>
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
                <TableCell>Quantity</TableCell>
                <TableCell>Tax</TableCell>
                <TableCell>Purchase Price</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Purchase Date</TableCell>
                <TableCell> Edit</TableCell>
                
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExpenses.map((expense, index) => (
                <TableRow key={expense.id}>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell>{expense.name}</TableCell>
                  <TableCell>{expense.quantity}</TableCell>
                  <TableCell>{expense.tax}</TableCell>
                  <TableCell>${Number(expense.purchasePrice).toFixed(2)}</TableCell>
                  <TableCell>{expense.totalPrice}</TableCell> 
                  {/* edit total calculation later */}
                  <TableCell>{format(new Date(expense.purchaseDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    {/* Edit button */}
                    <Tooltip title= "Edit">
                    <IconButton onClick={() => handleEditClick(expense)}>
                    <EditIcon color="primary" />
                    </IconButton>
                    </Tooltip>
                    
                    {/* Delete button */}
                    <Tooltip title= "Delete">
                    <IconButton onClick={() => deleteExpense(expense.name)}>
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
      </Box>

    <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Expense</DialogTitle>
        <DialogContent>
            <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <TextField
                label="Item Name"
                fullWidth
                value={selectedExpense?.name || ''}
                onChange={(e) =>
                    setSelectedExpense({ ...selectedExpense, name: e.target.value })
                }
                />
            </Grid>

            <Grid item xs={12} sm={6}>
                <TextField
                label="Purchase Date"
                fullWidth
                type='date'
                InputLabelProps={{ shrink: true }} // Keeps label static
                value={selectedExpense?.purchaseDate || ''}
                onChange={(e) =>
                    setSelectedExpense({ ...selectedExpense, purchaseDate: e.target.value })
                }
                />
            </Grid>





            {/* Other fields like shipping, purchasePrice, quantity, etc. */}
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
            onClick={() => {
                editExpense(selectedExpense.id, selectedExpense);
                setEditDialogOpen(false);
            }}
            color="primary"
            variant="contained"
            >
            Save Changes
            </Button>
        </DialogActions>
    </Dialog>


    <Modal open={openDialog} onClose={handleCloseDialog}>
        <Box
            sx={{
            padding: '20px',
            backgroundColor: 'white',
            margin: '100px auto',
            maxWidth: '650px', // Increased maxWidth for two columns
            borderRadius: '8px', // Curved borders
            boxShadow: 24, // Optional: adds a shadow for visual enhancement
            }}
        >
            <Typography variant="h6" sx={{ marginBottom: '20px' }}>Add Expense</Typography>
            
            <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <TextField
                required
                label="Item Name"
                fullWidth
                placeholder="Enter the name of the expense"
                helperText="e.g., Office Supplies"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                sx={{ minWidth: '300px', marginBottom: '10px' }}
                />
            </Grid>
            
            <Grid item xs={12} sm={6}>
                <TextField
                label="Tax"
                fullWidth
                placeholder="0.00"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                sx={{ minWidth: '250px', marginBottom: '10px' }}
                />
            </Grid>

            <Grid item xs={12} sm={6}>
                <TextField
                label="Shipping"
                fullWidth
                placeholder="0.00"
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
                sx={{ minWidth: '300px', marginBottom: '10px' }}
                />
            </Grid>
            
            <Grid item xs={12} sm={6}>
                <TextField
                required
                label="Quantity"
                fullWidth
                placeholder="Enter a number"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                sx={{ marginBottom: '10px' }}
                />
            </Grid>
            
            <Grid item xs={12} sm={6}>
                <TextField
                required
                label="Purchase Price per item"
                fullWidth
                placeholder="0.00 "
                helperText="e.g., $10"
                type="text"
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
                type='date'
                onChange={(e) => setDate(e.target.value)}
                sx={{ marginBottom: '10px' }}
                InputLabelProps={{ shrink: true }} // Keeps label static
                />
            </Grid>

            <Grid item xs={12} sm={6}>
                <TextField
                    label="Total"
                    fullWidth
                    value={total}
                    InputProps={{
                    readOnly: true,
                    }}
                    sx={{ minWidth: '300px', marginBottom: '10px' }}
                />
            </Grid>

            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <Button onClick={handleCloseDialog} sx={{ marginRight: '10px' }}>Cancel</Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                    addItem({
                        name: itemName,
                        tax: tax,
                        shipping: shipping,
                        quantity: quantity,
                        purchasePrice: price,
                        purchaseDate: date,
                        total: total,
                    });
                    handleCloseDialog();
                    }}
                >
                    Save
                </Button>
            </Box>
        </Box>
    </Modal>

    </Box>
  );
}