import React from 'react'
import {
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    Paper,
    Button,
    CircularProgress,
    TablePagination
} from '@mui/material'

const InventoryTable = ({ filteredInventory, loading, page, rowsPerPage, handlePageChange, removeItem }) => {
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Item Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Purchase Price</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>SKU</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Size</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Purchase Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Manage Item</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} align="center">
                                <CircularProgress />
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredInventory
                            .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                            .map(({ id, PurchasePrice, SKU, Size, PurchaseDate }) => (
                                <TableRow key={id}>
                                    <TableCell>{id.charAt(0).toUpperCase() + id.slice(1)}</TableCell>
                                    <TableCell>${PurchasePrice !== undefined ? PurchasePrice.toFixed(2) : 'N/A'}</TableCell>
                                    <TableCell>{SKU !== undefined ? SKU : 'N/A'}</TableCell>
                                    <TableCell>{Size !== undefined ? Size : 'N/A'}</TableCell>
                                    <TableCell>{PurchaseDate ? PurchaseDate.toLocaleDateString() : 'N/A'}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            onClick={() => removeItem(id)}
                                        >
                                            Remove
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                    )}
                </TableBody>
            </Table>
            <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={filteredInventory.length}
                rowsPerPage={rowsPerPage}
                page={page - 1}
                onPageChange={handlePageChange}
            />
        </TableContainer>
    )
}

export default InventoryTable
