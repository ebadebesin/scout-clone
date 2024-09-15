"use client";

import { useState, useEffect } from 'react';
import { Box, Typography, Paper, MenuItem, Select, Grid } from '@mui/material';
import ResponsiveDrawer from '@/components/ResponsiveDrawer';
import { useUser } from '@clerk/nextjs';
import { doc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  subDays,
  subWeeks,
  subMonths,
  subYears,
  isAfter,
  format,
  isValid,
  compareAsc
} from 'date-fns';

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [inventoryValue, setInventoryValue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [salesItems, setSalesItems] = useState([]);
  const [timeRange, setTimeRange] = useState('24H');
  const [graphType, setGraphType] = useState('inventoryValue'); // Default graph type
  const [graphData, setGraphData] = useState([]);

  // Fetch inventory and sales data
  const fetchInventoryAndSalesData = async () => {
    if (!isLoaded || !isSignedIn) return;

    try {
      // Fetch inventory
      const userDocRef = doc(collection(db, "users"), user.id);
      const inventorySnapshot = await getDocs(collection(userDocRef, "items"));
      const inventoryData = inventorySnapshot.docs.map(doc => doc.data());
      setInventoryItems(inventoryData);

      // Calculate total inventory value
      const totalInventoryValue = inventoryData.reduce((acc, item) => {
        const purchasePrice = parseFloat(item.purchasePrice || 0);
        return acc + (isNaN(purchasePrice) ? 0 : purchasePrice);
      }, 0);
      setInventoryValue(totalInventoryValue);

      // Fetch sales
      const salesSnapshot = await getDocs(collection(userDocRef, "sales"));
      const salesData = salesSnapshot.docs.map(doc => doc.data());
      setSalesItems(salesData);

      // Calculate total sales and profit
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
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  const generateGraphData = (inventoryData, salesData) => {
    let filteredInventory = filterDataByTimeRange(inventoryData, 'purchaseDate');
    let filteredSales = filterDataByTimeRange(salesData, 'soldDate');

    let data = [];

    if (graphType === 'inventoryValue') {
      data = filteredInventory
        .map(item => {
          let date;
          if (item.purchaseDate && item.purchaseDate.toDate) {
            date = item.purchaseDate.toDate(); // Handle Firestore Timestamp
          } else {
            date = new Date(item.purchaseDate);
          }
          if (!isValid(date)) return null; // Skip invalid dates
          return {
            date: date,
            value: parseFloat(item.purchasePrice || 0)
          };
        })
        .filter(Boolean)
        .sort((a, b) => compareAsc(a.date, b.date));
    } else if (graphType === 'totalSales') {
      data = filteredSales
        .map(sale => {
          let date;
          if (sale.soldDate && sale.soldDate.toDate) {
            date = sale.soldDate.toDate();
          } else {
            date = new Date(sale.soldDate);
          }
          if (!isValid(date)) return null;
          return {
            date: date,
            value: parseFloat(sale.salePrice || 0)
          };
        })
        .filter(Boolean)
        .sort((a, b) => compareAsc(a.date, b.date));
    } else if (graphType === 'realizedProfit') {
      data = filteredSales
        .map(sale => {
          let date;
          if (sale.soldDate && sale.soldDate.toDate) {
            date = sale.soldDate.toDate();
          } else {
            date = new Date(sale.soldDate);
          }
          if (!isValid(date)) return null;
          return {
            date: date,
            value: (parseFloat(sale.salePrice) || 0) - (parseFloat(sale.purchasePrice) || 0)
          };
        })
        .filter(Boolean)
        .sort((a, b) => compareAsc(a.date, b.date));
    }

    setGraphData(data);
  };

  const filterDataByTimeRange = (data, dateField) => {
    if (timeRange === 'ALL') {
      // Filter out entries with invalid dates
      return data.filter(item => {
        const dateValue = item[dateField];
        if (!dateValue) return false;
        let itemDate;
        if (dateValue.toDate) {
          itemDate = dateValue.toDate();
        } else {
          itemDate = new Date(dateValue);
        }
        return isValid(itemDate);
      });
    }

    const now = new Date();
    let timeFilter;

    if (timeRange === '24H') timeFilter = subDays(now, 1);
    else if (timeRange === '1W') timeFilter = subWeeks(now, 1);
    else if (timeRange === '1M') timeFilter = subMonths(now, 1);
    else if (timeRange === '1Y') timeFilter = subYears(now, 1);

    return data.filter(item => {
      const dateValue = item[dateField];
      if (!dateValue) return false;
      let itemDate;
      if (dateValue.toDate) {
        itemDate = dateValue.toDate();
      } else {
        itemDate = new Date(dateValue);
      }
      if (!isValid(itemDate)) return false;
      return isAfter(itemDate, timeFilter);
    });
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleGraphTypeChange = (event) => {
    setGraphType(event.target.value);
  };

  useEffect(() => {
    if (user) {
      fetchInventoryAndSalesData();
    }
  }, [user]);

  useEffect(() => {
    if (inventoryItems.length > 0 || salesItems.length > 0) {
      generateGraphData(inventoryItems, salesItems);
    }
  }, [inventoryItems, salesItems, timeRange, graphType]);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <ResponsiveDrawer />
      <Box component="main" sx={{ flexGrow: 1, padding: 3 }}>
        <Typography variant="h4" sx={{ marginBottom: 2 }}>
          Your Inventory Value: ${isNaN(inventoryValue) ? '0.00' : inventoryValue.toFixed(2)}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ padding: 2 }}>
              <Typography variant="h6">Total Inventory Value</Typography>
              <Typography variant="h4">
                ${isNaN(inventoryValue) ? '0.00' : inventoryValue.toFixed(2)}
              </Typography>
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
            <MenuItem value="ALL">All Time</MenuItem> {/* Added All Time option */}
          </Select>

          <Typography variant="h5" sx={{ marginTop: 4 }}>
            Select Graph Type:
          </Typography>
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
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) =>
                        isValid(new Date(date)) ? format(new Date(date), 'MM/dd/yyyy') : ''
                      }
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(label) =>
                        isValid(new Date(label)) ? format(new Date(label), 'MM/dd/yyyy') : ''
                      }
                    />
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