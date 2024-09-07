'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import Filters from '../components/Filters'
import InventoryTable from '../components/InventoryTable'
import Export from '../components/Export'
import { firestore } from '@/firebase'
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  Timestamp,
  where
} from 'firebase/firestore'

export default function ScoutClone() {
  const [inventory, setInventory] = useState([])
  const [filteredInventory, setFilteredInventory] = useState([])
  const [filter, setFilter] = useState({
    purchasePrice: '',
    sku: '',
    size: '',
    dateRange: '',
    priceSort: '',
    skuSort: '',
  })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [newItem, setNewItem] = useState({
    itemName: '',
    purchasePrice: '',
    sku: '',
    size: '',
    purchaseDate: '',
  })
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Fetch inventory from Firestore
  const updateInventory = async () => {
    setLoading(true)
    try {
      const snapshot = query(
        collection(firestore, 'Inventory'),
        where('isUserAdded', '==', true)
      )
      const docs = await getDocs(snapshot)
      const inventoryList = []
      docs.forEach((doc) => {
        const data = doc.data()
        inventoryList.push({ id: doc.id, ...data, PurchaseDate: data.PurchaseDate?.toDate() })
      })
      setInventory(inventoryList)
    } catch (error) {
      console.error('Error fetching inventory: ', error)
    } finally {
      setLoading(false)
    }
  }

  // Save item to Firestore (add)
  const saveItem = async () => {
    if (!newItem.itemName || !newItem.purchasePrice || !newItem.sku || !newItem.size || !newItem.purchaseDate) {
      console.error('Please fill in all fields')
      return
    }

    console.log('Saving Item:', newItem) // Log the new item details

    try {
      const docRef = doc(collection(firestore, 'Inventory'))

      await setDoc(docRef, {
        ItemName: newItem.itemName, // Ensure field names match
        PurchasePrice: parseFloat(newItem.purchasePrice),
        SKU: parseInt(newItem.sku, 10),
        Size: parseInt(newItem.size, 10),
        PurchaseDate: Timestamp.fromDate(new Date(newItem.purchaseDate)),
        isUserAdded: true,
      })

      // Refresh inventory data after saving
      await updateInventory()
      handleClose()
    } catch (error) {
      console.error('Error saving item: ', error)
    }
  }

  // Remove an item from Firestore
  const removeItem = async (id) => {
    try {
      const docRef = doc(collection(firestore, 'Inventory'), id)
      await deleteDoc(docRef)
      await updateInventory()
    } catch (error) {
      console.error('Error removing item: ', error)
    }
  }

  const handleFilterChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value })
  }

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPage(newPage)
  }

  // Filter and sort inventory
  useEffect(() => {
    let filtered = inventory.filter((item) => {
      const matchesPurchasePrice = !filter.purchasePrice || item.PurchasePrice === parseFloat(filter.purchasePrice)
      const matchesSKU = !filter.sku || item.SKU === parseInt(filter.sku, 10)
      const matchesSize = !filter.size || item.Size === parseInt(filter.size, 10)

      // Date Range Filtering
      let matchesDateRange = true
      if (filter.dateRange) {
        const now = new Date()
        const itemDate = item.PurchaseDate instanceof Timestamp ? item.PurchaseDate.toDate() : new Date(item.PurchaseDate)
        const diffInDays = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24))

        switch (filter.dateRange) {
          case 'week':
            matchesDateRange = diffInDays <= 7
            break
          case 'month':
            matchesDateRange = diffInDays <= 30
            break
          case '6months':
            matchesDateRange = diffInDays <= 180
            break
          case 'year':
            matchesDateRange = diffInDays <= 365
            break
          default:
            matchesDateRange = true
        }
      }

      return matchesPurchasePrice && matchesSKU && matchesSize && matchesDateRange
    })

    // Sorting
    if (filter.priceSort) {
      filtered.sort((a, b) => filter.priceSort === 'lowToHigh' ? a.PurchasePrice - b.PurchasePrice : b.PurchasePrice - a.PurchasePrice)
    }

    if (filter.skuSort) {
      filtered.sort((a, b) => filter.skuSort === 'lowToHigh' ? a.SKU - b.SKU : b.SKU - a.SKU)
    }

    setFilteredInventory(filtered)
  }, [inventory, filter])

  useEffect(() => {
    updateInventory()
  }, [])

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open)
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      justifyContent="center"
      flexDirection="column"
      alignItems="center"
      gap={2}
      p={2}
    >
      <IconButton
        edge="start"
        color="inherit"
        aria-label="menu"
        onClick={toggleDrawer(true)}
        sx={{ position: 'absolute', top: 16, left: 16 }}
      >
        <MenuIcon />
      </IconButton>

      <Typography variant="h4" gutterBottom color="primary">
        Scout Clone
      </Typography>

      <Box width="100%" maxWidth="1200px">
        <Stack spacing={2} mb={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Export filteredInventory={filteredInventory} />
          </Stack>

          <Filters filter={filter} handleFilterChange={handleFilterChange} />
        </Stack>

        <InventoryTable
          filteredInventory={filteredInventory}
          loading={loading}
          page={page}
          rowsPerPage={rowsPerPage}
          handlePageChange={handlePageChange}
          removeItem={removeItem}
        />
      </Box>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <Box
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
          sx={{ width: 250 }}
        >
          <List>
            <ListItem button>
              <ListItemText primary="Item 1" />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Item 2" />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Item 3" />
            </ListItem>
            <Divider />
            <ListItem button>
              <ListItemText primary="Additional Action 1" />
            </ListItem>
            <ListItem button>
              <ListItemText primary="Additional Action 2" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </Box>
  )
}
