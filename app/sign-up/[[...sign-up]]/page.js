import React from 'react'
import { Container, Box, Typography } from '@mui/material'
import { SignUp } from '@clerk/nextjs'
import ResponsiveDrawer from '@/components/ResponsiveDrawer'

export default function SignUpPage() {
  // ... (component body)

  return (
    <Container maxWidth="100vw">
        <ResponsiveDrawer />
        <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        sx={{textAlign: 'center', my: 4}}
        >
        <Typography variant="h4" component="h1" gutterBottom>
            Sign Up
        </Typography>
        <SignUp />
        </Box>
    </Container>

  )
}