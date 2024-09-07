import React from 'react'
import { IconButton, Tooltip } from '@mui/material'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import * as XLSX from 'xlsx'
import { styled } from '@mui/material/styles'

const BlueCircleIconButton = styled(IconButton)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main, // Use the standard blue color from the theme
    color: theme.palette.common.white,            // White icon color
    borderRadius: '50%',                         // Circle shape
    width: 48,                                   // Adjust size as needed
    height: 48,                                  // Adjust size as needed
    '&:hover': {
        backgroundColor: theme.palette.primary.dark, // Darker blue from the theme on hover
    },
    '&:active': {
        backgroundColor: theme.palette.primary.dark, // Keep darker blue when button is active
    }
}))

const Export = ({ filteredInventory }) => {
    const exportToCSV = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredInventory.map(item => ({
            ...item,
            PurchaseDate: item.PurchaseDate ? item.PurchaseDate.toLocaleDateString() : 'N/A'
        })))
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory')
        XLSX.writeFile(workbook, 'inventory.csv')
    }

    return (
        <Tooltip title="Export to CSV">
            <BlueCircleIconButton onClick={exportToCSV}>
                <FileDownloadOutlinedIcon />
            </BlueCircleIconButton>
        </Tooltip>
    )
}

export default Export
