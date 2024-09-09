"use client";

import { useState } from "react";
import { Box, TextField, Button, Typography, Snackbar } from "@mui/material";
import ResponsiveDrawer from '@/components/ResponsiveDrawer';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSnackbarMessage('Message sent successfully! We will get back to you soon!');
        setSnackbarOpen(true);
        setFormData({
          name: "",
          email: "",
          message: "",
        });
      } else {
        setSnackbarMessage('Failed to send message. Please try again.');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setSnackbarMessage('An error occurred. Please try again later.');
      setSnackbarOpen(true);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, margin: "0 auto", padding: 3 }}>
      <ResponsiveDrawer />
      <Typography variant="h4" mb={2}>Contact Us!</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Name"
          name="name"
          fullWidth
          margin="normal"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
        <TextField
          label="Email"
          name="email"
          fullWidth
          margin="normal"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
        <TextField
          label="Message"
          name="message"
          fullWidth
          multiline
          rows={4}
          margin="normal"
          value={formData.message}
          onChange={handleInputChange}
          required
        />
        <Button variant="contained" color="primary" type="submit">
          Send
        </Button>
      </form>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}
