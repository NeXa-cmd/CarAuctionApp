import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import axios from 'axios';

const TestUsers = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      console.log('Using token:', token);
      
      const response = await axios.get('http://localhost:5001/api/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('API Response:', response.data);
      setUsers(response.data.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Test Users Page
      </Typography>
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={fetchUsers}
        sx={{ mb: 3 }}
      >
        Fetch Users
      </Button>
      
      {loading && <Typography>Loading...</Typography>}
      
      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}
      
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Users ({users.length})
        </Typography>
        
        {users.length === 0 ? (
          <Typography>No users found</Typography>
        ) : (
          users.map(user => (
            <Paper 
              key={user._id} 
              sx={{ p: 2, mb: 1, bgcolor: '#f5f5f5' }}
            >
              <Typography><strong>Username:</strong> {user.username}</Typography>
              <Typography><strong>Email:</strong> {user.email}</Typography>
              <Typography><strong>Role:</strong> {user.role}</Typography>
              <Typography><strong>ID:</strong> {user._id}</Typography>
            </Paper>
          ))
        )}
      </Paper>
    </Box>
  );
};

export default TestUsers;
