import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { getAuctions, createAuction, updateAuction, deleteAuction, getCars } from '../services/api';

export default function Auctions() {
  const [open, setOpen] = useState(false);
  const [editingAuction, setEditingAuction] = useState(null);
  const [formData, setFormData] = useState({
    car: '',
    startTime: '',
    endTime: '',
    startingPrice: 0,
    currentPrice: 0,
    status: 'upcoming',
  });

  const queryClient = useQueryClient();
  const [cars, setCars] = useState([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [carsError, setCarsError] = useState(null);

  // Fetch auctions directly with axios
  const [auctions, setAuctions] = useState([]);
  const [auctionsLoading, setAuctionsLoading] = useState(true);
  const [auctionsError, setAuctionsError] = useState(null);
  
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setAuctionsLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5001/api/auctions', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('Auctions API response:', response.data);
        setAuctions(response.data.data || []);
        setAuctionsLoading(false);
      } catch (err) {
        console.error('Error fetching auctions:', err);
        setAuctionsError(err.message);
        setAuctionsLoading(false);
      }
    };

    fetchAuctions();
  }, []);
  
  // Fetch cars directly with axios
  useEffect(() => {
    const fetchCars = async () => {
      try {
        setCarsLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5001/api/cars', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('Cars API response:', response.data);
        setCars(response.data.data || []);
        setCarsLoading(false);
      } catch (err) {
        console.error('Error fetching cars:', err);
        setCarsError(err.message);
        setCarsLoading(false);
      }
    };

    fetchCars();
  }, []);
  
  console.log('Cars available for auctions:', cars);
  console.log('Auctions available:', auctions);

  // Create auction function
  const handleCreateAuction = async (auctionData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5001/api/auctions', auctionData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh auctions list
      const response = await axios.get('http://localhost:5001/api/auctions', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setAuctions(response.data.data || []);
      handleClose();
    } catch (err) {
      console.error('Error creating auction:', err);
      alert(`Error creating auction: ${err.message}`);
    }
  };

  // Update auction function
  const handleUpdateAuction = async (id, auctionData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5001/api/auctions/${id}`, auctionData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh auctions list
      const response = await axios.get('http://localhost:5001/api/auctions', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setAuctions(response.data.data || []);
      handleClose();
    } catch (err) {
      console.error('Error updating auction:', err);
      alert(`Error updating auction: ${err.message}`);
    }
  };

  // Delete auction function
  const handleDeleteAuction = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/auctions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh auctions list
      const response = await axios.get('http://localhost:5001/api/auctions', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setAuctions(response.data.data || []);
    } catch (err) {
      console.error('Error deleting auction:', err);
      alert(`Error deleting auction: ${err.message}`);
    }
  };

  const handleOpen = (auction = null) => {
    if (auction) {
      setEditingAuction(auction);
      setFormData({
        car: auction.car._id,
        startTime: new Date(auction.startTime).toISOString().slice(0, 16),
        endTime: new Date(auction.endTime).toISOString().slice(0, 16),
        startingPrice: auction.startingPrice,
        currentPrice: auction.currentPrice,
        status: auction.status,
      });
    } else {
      setEditingAuction(null);
      setFormData({
        car: '',
        startTime: '',
        endTime: '',
        startingPrice: 0,
        currentPrice: 0,
        status: 'upcoming',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingAuction(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingAuction) {
      handleUpdateAuction(editingAuction._id, formData);
    } else {
      handleCreateAuction(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this auction?')) {
      handleDeleteAuction(id);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'upcoming':
        return 'info';
      case 'ended':
        return 'error';
      default:
        return 'default';
    }
  };

  if (auctionsLoading || carsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography>Loading auctions and cars...</Typography>
      </Box>
    );
  }

  if (auctionsError || carsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 2, bgcolor: '#ffebee' }}>
          <Typography color="error">Error: {auctionsError || carsError}</Typography>
          <Button 
            variant="contained" 
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Auctions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Create Auction
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Car</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Starting Price</TableCell>
              <TableCell>Current Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(auctions) && auctions.map((auction) => (
              <TableRow key={auction._id}>
                <TableCell>{auction.car.title}</TableCell>
                <TableCell>
                  {new Date(auction.startTime).toLocaleString()}
                </TableCell>
                <TableCell>
                  {new Date(auction.endTime).toLocaleString()}
                </TableCell>
                <TableCell>${auction.startingPrice}</TableCell>
                <TableCell>${auction.currentPrice}</TableCell>
                <TableCell>
                  <Chip
                    label={auction.status}
                    color={getStatusColor(auction.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpen(auction)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(auction._id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAuction ? 'Edit Auction' : 'Create Auction'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                select
                label="Car"
                fullWidth
                value={formData.car}
                onChange={(e) => setFormData({ ...formData, car: e.target.value })}
              >
                {carsLoading ? (
                  <MenuItem disabled>Loading cars...</MenuItem>
                ) : cars.length > 0 ? (
                  cars.map((car) => (
                    <MenuItem key={car._id} value={car._id}>
                      {car.title || `${car.make} ${car.model} (${car.year})`}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No cars available</MenuItem>
                )}
              </TextField>
              <TextField
                label="Start Time"
                type="datetime-local"
                fullWidth
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Time"
                type="datetime-local"
                fullWidth
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Starting Price"
                type="number"
                fullWidth
                value={formData.startingPrice}
                onChange={(e) => setFormData({ ...formData, startingPrice: parseInt(e.target.value) })}
              />
              {editingAuction && (
                <TextField
                  label="Current Price"
                  type="number"
                  fullWidth
                  value={formData.currentPrice}
                  onChange={(e) => setFormData({ ...formData, currentPrice: parseInt(e.target.value) })}
                />
              )}
              <TextField
                select
                label="Status"
                fullWidth
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="ended">Ended</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingAuction ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
