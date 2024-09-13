"use client";

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, MenuItem, Select, InputLabel, FormControl, Grid2 } from '@mui/material';
import Grid from '@mui/material/Grid2'
import ResponsiveDrawer from '@/components/ResponsiveDrawer';
import { useUser } from '@clerk/nextjs';
import { doc, collection, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { subDays, subWeeks, subMonths, subYears, isAfter } from 'date-fns';

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [inventoryValue, setInventoryValue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [salesItems, setSalesItems] = useState([]);
  const [timeRange, setTimeRange] = useState('24H');
  const [graphType, setGraphType] = useState('inventoryValue'); // Default graph type: Inventory Value
  const [graphData, setGraphData] = useState([]);

  // Memoize fetchInventoryAndSalesData to prevent re-creation on each render
  const fetchInventoryAndSalesData = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
  
    try {
      const userDocRef = doc(collection(db, "users"), user.id);
      const inventorySnapshot = await getDocs(collection(userDocRef, "items"));
      const inventoryData = inventorySnapshot.docs.map(doc => doc.data());
      
      // Log the data to check its structure
      console.log("Inventory Data:", inventoryData);
  
      // Safely calculate total inventory value
      const totalInventoryValue = inventoryData.reduce((acc, item) => {
        const purchasePrice = parseFloat(item.purchasePrice || 0);
  
        // Log each item's purchasePrice to check its value
        console.log(`Item: ${item.name}, Purchase Price: ${item.purchasePrice}, Parsed: ${purchasePrice}`);
  
        return acc + (isNaN(purchasePrice) ? 0 : purchasePrice);
      }, 0);
  
      // Set the calculated inventory value
      setInventoryValue(totalInventoryValue);
  
      // Fetch sales data (this part remains the same)
      const salesSnapshot = await getDocs(collection(userDocRef, "sales"));
      const salesData = salesSnapshot.docs.map(doc => doc.data());
      setSalesItems(salesData);
  
      let totalSalesValue = 0;
      let totalProfitValue = 0;
  
      salesData.forEach(sale => {
        const salePrice = parseFloat(sale.salePrice || 0);
        const purchasePrice = parseFloat(sale.purchasePrice || 0);
        const profit = salePrice - purchasePrice;
        totalSalesValue += isNaN(salePrice) ? 0 : salePrice;
        totalProfitValue += isNaN(profit) ? 0 : profit;
      });
  
      setTotalSales(totalSalesValue);
      setTotalProfit(totalProfitValue);
  
      generateGraphData(inventoryData, salesData);
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  }, [isLoaded, isSignedIn, user]);
  

  const generateGraphData = (inventoryData, salesData) => {
    let filteredInventory = filterDataByTimeRange(inventoryData);
    let filteredSales = filterDataByTimeRange(salesData);

    let data = [];
    if (graphType === 'inventoryValue') {
      data = filteredInventory.map(item => ({
        date: item.purchaseDate,
        value: parseFloat(item.purchasePrice || 0),
      }));
    } else if (graphType === 'totalSales') {
      data = filteredSales.map(sale => ({
        date: sale.soldDate,
        value: parseFloat(sale.salePrice || 0),
      }));
    } else if (graphType === 'realizedProfit') {
      data = filteredSales.map(sale => ({
        date: sale.soldDate,
        value: parseFloat(sale.salePrice) - parseFloat(sale.purchasePrice),
      }));
    }

    setGraphData(data);
  };

  const filterDataByTimeRange = (data) => {
    const now = new Date();
    let timeFilter;

    if (timeRange === '24H') timeFilter = subDays(now, 1);
    else if (timeRange === '1W') timeFilter = subWeeks(now, 1);
    else if (timeRange === '1M') timeFilter = subMonths(now, 1);
    else if (timeRange === '1Y') timeFilter = subYears(now, 1);

    return data.filter(item => isAfter(new Date(item.purchaseDate || item.soldDate), timeFilter));
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleGraphTypeChange = (event) => {
    setGraphType(event.target.value);
    generateGraphData(inventoryItems, salesItems);
  };

  useEffect(() => {
    if (user) {
      fetchInventoryAndSalesData();
    }
  }, [user, timeRange, graphType, fetchInventoryAndSalesData]);


  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <ResponsiveDrawer />
      <Box component="main" sx={{ flexGrow: 1, padding: 3 }}>
        <Typography variant="h4" sx={{ marginBottom: 2 }}>Your Inventory Value: ${isNaN(inventoryValue) ? '0.00' : inventoryValue.toFixed(2)}</Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ padding: 2 }}>
              <Typography variant="h6">Total Inventory Value</Typography>
              <Typography variant="h4">${isNaN(inventoryValue) ? '0.00' : inventoryValue.toFixed(2)}</Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper sx={{ padding: 2 }}>
              <Typography variant="h6">Total Sales</Typography>
              <Typography variant="h4">${totalSales.toFixed(2)}</Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper sx={{ padding: 2 }}>
              <Typography variant="h6">Total Profit</Typography>
              <Typography variant="h4">${totalProfit.toFixed(2)}</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ marginTop: 4 }}>
          <Typography variant="h5">Select Time Range:</Typography>
          <Select value={timeRange} onChange={handleTimeRangeChange}>
            <MenuItem value="24H">Last 24 Hours</MenuItem>
            <MenuItem value="1W">Last Week</MenuItem>
            <MenuItem value="1M">Last Month</MenuItem>
            <MenuItem value="1Y">Last Year</MenuItem>
          </Select>

          <Typography variant="h5" sx={{ marginTop: 4 }}>Select Graph Type:</Typography>
          <Select value={graphType} onChange={handleGraphTypeChange}>
            <MenuItem value="inventoryValue">Inventory Value</MenuItem>
            <MenuItem value="totalSales">Total Sales</MenuItem>
            <MenuItem value="realizedProfit">Realized Profit</MenuItem>
          </Select>
        </Box>

        {/* Reports Section */}
        <Box sx={{ marginTop: 4 }}>
          <Typography variant="h5">Reports</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper sx={{ padding: 2 }}>
                <Typography variant="h6">Inventory and Sales Over Time</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}