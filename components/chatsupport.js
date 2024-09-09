'use client'

import { Box, Button, Stack, TextField, Typography, CircularProgress, Avatar, Drawer, Fab, IconButton } from '@mui/material'
import { useState, useRef, useEffect } from 'react'
import React from 'react'
import Image from 'next/image'
import ChatBubble from '@mui/icons-material/ChatBubble';
import CloseIcon from '@mui/icons-material/Close';
import ScoutIcon from '@/public/icon.png';

export default function ChatSupport() {
    const [messages, setMessages] = useState([
      {
        role: 'assistant',
        content: "Hi! I'm the Scout Clone support assistant. How can I help you today?",
      },
    ])
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [open, setOpen] = useState(false); // Drawer state

    const sendMessage = async () => {
        if (!message.trim() || isLoading) return; 
        setIsLoading(true)
      
        const userMessage = message;
        setMessage('')
        setMessages((messages) => [
          ...messages,
          { role: 'user', content: userMessage },
          { role: 'assistant', content: '' },
        ])
      
        try {
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([...messages, { role: 'user', content: userMessage }]),
          })
      
          if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`)
          }
      
          const reader = response.body.getReader()
          const decoder = new TextDecoder()

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const text = decoder.decode(value, { stream: true })
            setMessages((messages) => {
              let lastMessage = messages[messages.length - 1]
              let otherMessages = messages.slice(0, messages.length - 1)
              return [
                ...otherMessages,
                { ...lastMessage, content: lastMessage.content + text },
              ]
            })
          }
        } catch (error) {
          console.error('Error:', error)
          setMessages((messages) => [
            ...messages,
            { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
          ])
        }
        setIsLoading(false)
    }

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          sendMessage()
        }
    }
    
    const messagesEndRef = useRef(null)
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    return (
        <>
        {/* Floating Chat Button */}
        <Fab
          color="primary"
          aria-label="chat"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setOpen(true)}
        >
          <ChatBubble />
        </Fab>

        {/* Drawer for Chat Support */}
        <Drawer
          anchor="right"
          open={open}
          onClose={() => setOpen(false)}
          PaperProps={{ sx: { width: 400 } }} // Adjust width
        >
          <Box
            width="100%"
            height="100%"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            bgcolor="#f5f5f5"
          >

            <Stack
              direction={'column'}
              width="100%"
              maxWidth="600px"
              height="80vh"
              borderRadius={8}
              boxShadow="0 4px 8px rgba(0, 0, 0, 0.1)"
              bgcolor="white"
              p={2}
              spacing={2}
            >
              {/* Chat Header */}
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Image src={ScoutIcon} alt="Scout Icon" width={40} height={40} />
                <Typography
                  variant="h5"
                  component="h1"
                  align="center"
                  gutterBottom
                  sx={{ fontWeight: 'bold', color: '#333' }}
                >
                  Scout Clone Chat Support
                </Typography>
                <IconButton onClick={() => setOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Stack>

              {/* Chat Messages */}
              <Stack
                direction={'column'}
                spacing={2}
                flexGrow={1}
                overflow="auto"
                maxHeight="100%"
                p={1}
                border="1px solid #ddd"
                borderRadius={4}
              >
                {messages.map((message, index) => (
                  <Box
                    key={index}
                    display="flex"
                    justifyContent={
                      message.role === 'assistant' ? 'flex-start' : 'flex-end'
                    }
                    mb={1}
                  >
                    <Box
                      bgcolor={
                        message.role === 'assistant'
                          ? '#e0f7fa'
                          : '#c5cae9'
                      }
                      color="black"
                      borderRadius={16}
                      p={2}
                      maxWidth="80%"
                      wordBreak="break-word"
                      boxShadow="0 2px 4px rgba(0, 0, 0, 0.1)"
                    >
                      {message.content}
                    </Box>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Stack>

              {/* Input Field */}
              <Stack direction={'row'} spacing={2} alignItems="center">
                <TextField
                  label="Type your message"
                  fullWidth
                  variant="outlined"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress} 
                  disabled={isLoading}
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={sendMessage}
                  disabled={isLoading}
                  size="large"
                >
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Send'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Drawer>
        </>
    )
}
