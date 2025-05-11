import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import socketService from '../services/socket';
import { placeBid as apiPlaceBid, getAuctionById } from '../services/api';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../contexts/AuthContext';

const API_URL = Platform.OS === 'ios' ? 'http://157.230.124.2:5001/api' : 'http://10.0.2.2:5001/api';

const CarDetailScreen = ({ route, navigation }) => {
  const { auctionId } = route.params;
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  const calculateTimeLeft = (endTime) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const difference = end - now;

    if (difference <= 0) {
      return 'Ended';
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const updateTimeLeft = () => {
    if (auction?.endTime) {
      setTimeLeft(calculateTimeLeft(auction.endTime));
    }
  };

  useEffect(() => {
    if (auction?.endTime) {
      updateTimeLeft();
      const timer = setInterval(updateTimeLeft, 1000);
      return () => clearInterval(timer);
    }
  }, [auction?.endTime]);

  const fetchAuctionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getAuctionById(auctionId);
      if (!response) throw new Error('No data received from server');
      
      // Get the auction data from the response
      const auctionData = response.data || response;
      if (!auctionData) throw new Error('Invalid auction data format');
      
      // Validate required fields
      if (!auctionData._id) throw new Error('Invalid auction ID');
      if (!auctionData.car) throw new Error('Missing car data');
      
      // Set defaults for optional fields and construct full image URL
      const processedAuction = {
        ...auctionData,
        currentBid: auctionData.currentPrice || auctionData.startingPrice || 0,
        car: {
          ...auctionData.car,
          mileage: auctionData.car.mileage || 0,
          transmission: auctionData.car.transmission || 'Not specified',
          color: auctionData.car.color || 'Not specified',
          year: auctionData.car.year || 'Unknown',
          condition: auctionData.car.condition || 'Unknown',
          imageUrl: auctionData.car.images?.[0] 
            ? `${API_URL}${auctionData.car.images[0]}` 
            : 'https://via.placeholder.com/400'
        }
      };
      
      console.log('Setting processed auction data:', processedAuction);
      setAuction(processedAuction);
      
    } catch (err) {
      console.error('Error fetching auction details:', err);
      setError(err.message);
      Alert.alert('Error', err.message || 'Failed to load auction details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctionDetails();
    
    if (auction?._id) {
      socketService.joinAuction(auction._id);
      
      // Listen for new bids
      socketService.onNewBid((bidData) => {
        if (bidData.auctionId === auction._id) {
          setAuction(prev => ({
            ...prev,
            currentPrice: bidData.amount,
            currentWinner: bidData.bidder
          }));
        }
      });

      // Listen for auction ended event
      socketService.onAuctionEnded((auctionData) => {
        if (auctionData.auctionId === auction._id) {
          setAuction(prev => ({
            ...prev,
            status: 'ended',
            currentPrice: auctionData.finalPrice,
            winner: auctionData.winnerId
          }));
          
          // Show a toast notification
          Toast.show({
            type: 'info',
            text1: 'Auction Ended',
            text2: auctionData.winnerId === user.id 
              ? 'Congratulations! You won this auction!' 
              : 'This auction has ended.',
            visibilityTime: 4000,
            autoHide: true,
          });
        }
      });
    }

    return () => {
      if (auction?._id) {
        socketService.leaveAuction(auction._id);
        socketService.removeAllListeners();
      }
    };
  }, [auction?._id]);

  const getDetails = (car) => [
    { id: '1', icon: 'speedometer-outline', label: 'Mileage', value: car.mileage ? `${car.mileage.toLocaleString()} mi` : 'N/A' },
    { id: '2', icon: 'color-palette-outline', label: 'Color', value: car.color || 'N/A' },
    { id: '3', icon: 'calendar-outline', label: 'Year', value: car.year ? car.year.toString() : 'N/A' },
    { id: '4', icon: 'car-outline', label: 'Transmission', value: car.transmission || 'N/A' },
    { id: '5', icon: 'construct-outline', label: 'Condition', value: car.condition || 'N/A' },
  ];

  const placeBid = async () => {
    if (!bidAmount || parseInt(bidAmount) <= auction.currentBid) {
      Alert.alert('Invalid Bid', 'Please enter an amount higher than the current bid');
      return;
    }

    try {
      await apiPlaceBid(auction._id, parseInt(bidAmount));
      socketService.placeBid(auction._id, parseInt(bidAmount));
      setBidAmount('');
      Alert.alert('Success', 'Your bid has been placed!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to place bid');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!auction || !auction.car) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Auction not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        style={styles.image}
        source={{ uri: auction.car.imageUrl }}
        defaultSource={require('../assets/car-placeholder.jpg')}
      />
      
      <View style={styles.content}>
        <Text style={styles.title}>{auction.car.make} {auction.car.model}</Text>
        
        <View style={styles.priceContainer}>
          <View style={styles.bidInfo} key="currentBid">
            <Text style={styles.label}>{timeLeft === 'Ended' ? 'Final Price' : 'Current Bid'}</Text>
            <Text style={styles.price}>${auction.currentBid ? auction.currentBid.toLocaleString() : '0'}</Text>
          </View>
          <View style={styles.bidInfo} key="timeLeft">
            <Text style={styles.label}>Time Left</Text>
            <Text style={[styles.timeLeft, timeLeft === 'Ended' && styles.endedText]}>
              {timeLeft || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          {getDetails(auction.car).map(detail => (
            <View key={detail.id} style={styles.detailItem}>
              <Icon name={detail.icon} size={24} color="#007AFF" />
              <Text style={styles.detailLabel}>{detail.label}</Text>
              <Text style={styles.detailValue}>{detail.value}</Text>
            </View>
          ))}
        </View>

        {timeLeft !== 'Ended' && (
          <View style={styles.bidSection}>
            <Text style={styles.bidLabel}>Place Your Bid</Text>
            <View style={styles.bidInputContainer}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.bidInput}
                value={bidAmount}
                onChangeText={setBidAmount}
                keyboardType="numeric"
                placeholder="Enter bid amount"
              />
            </View>
            <TouchableOpacity
              style={[styles.bidButton, loading && styles.bidButtonDisabled]}
              onPress={placeBid}
              disabled={!bidAmount || loading}
            >
              <Text style={styles.bidButtonText}>Place Bid</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {auction.car.description || 'No description available'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    fontSize: 16,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000000',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bidInfo: {
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  timeLeft: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailItem: {
    width: '45%',
    marginBottom: 16,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginTop: 2,
  },
  bidSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bidLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000000',
  },
  bidInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dollarSign: {
    fontSize: 24,
    color: '#8E8E93',
    marginRight: 8,
  },
  bidInput: {
    flex: 1,
    fontSize: 24,
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  bidButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bidButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000000',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8E8E93',
  },
  endedText: {
    color: '#FF3B30',
    fontWeight: '600'
  },
  bidButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
});

export default CarDetailScreen;
