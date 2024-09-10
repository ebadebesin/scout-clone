import React from 'react'
import {
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack
} from '@mui/material'

const Filters = ({ filter, handleFilterChange }) => {
    return (
        <Stack direction="row" spacing={2} alignItems="center">
            <TextField
                label="Purchase Price"
                variant="outlined"
                name="purchasePrice"
                value={filter.purchasePrice}
                onChange={handleFilterChange}
                type="number"
                fullWidth
            />
            <TextField
                label="SKU"
                variant="outlined"
                name="sku"
                value={filter.sku}
                onChange={handleFilterChange}
                type="number"
                fullWidth
            />
            <TextField
                label="Size"
                variant="outlined"
                name="size"
                value={filter.size}
                onChange={handleFilterChange}
                type="number"
                fullWidth
            />
            <FormControl variant="outlined" fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                    name="dateRange"
                    value={filter.dateRange}
                    onChange={handleFilterChange}
                    label="Date Range"
                >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="week">Last 7 Days</MenuItem>
                    <MenuItem value="month">Last 30 Days</MenuItem>
                    <MenuItem value="6months">Last 6 Months</MenuItem>
                    <MenuItem value="year">Last Year</MenuItem>
                </Select>
            </FormControl>
            <FormControl variant="outlined" fullWidth>
                <InputLabel>Price Sort</InputLabel>
                <Select
                    name="priceSort"
                    value={filter.priceSort}
                    onChange={handleFilterChange}
                    label="Price Sort"
                >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="lowToHigh">Low to High</MenuItem>
                    <MenuItem value="highToLow">High to Low</MenuItem>
                </Select>
            </FormControl>
            <FormControl variant="outlined" fullWidth>
                <InputLabel>SKU Sort</InputLabel>
                <Select
                    name="skuSort"
                    value={filter.skuSort}
                    onChange={handleFilterChange}
                    label="SKU Sort"
                >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="lowToHigh">Low to High</MenuItem>
                    <MenuItem value="highToLow">High to Low</MenuItem>
                </Select>
            </FormControl>
        </Stack>
    )
}

export default Filters
