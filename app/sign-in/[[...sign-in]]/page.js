
import React from 'react'
import { Container, Box, Typography } from '@mui/material'
import { SignIn } from '@clerk/nextjs'

import ResponsiveDrawer from '@/components/ResponsiveDrawer'

export default function SignInPage() {
  // ... (component body)

  return (
    <Container maxWidth="100vw" maxHeight="100vh" >

       <ResponsiveDrawer />
        <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        position={'sticky'}
        maxHeight="100vh"

        sx={{textAlign: 'center', my: 4}}
        >
        <Typography variant="h4" component="h1" gutterBottom>
            Sign In
        </Typography>
        <SignIn />
        </Box>

    </Container>

  )
}
