import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getMyAuctions } from '../services/api';

const API_URL = Platform.OS === 'ios' ? 'http://157.230.124.2:5001/api' : 'http://10.0.2.2:5001/api';

const MyAuctionsScreen = ({ navigation }) => {
  const [wonAuctions, setWonAuctions] = useState([]);
  const [lostAuctions, setLostAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyAuctions();
  }, []);

  const loadMyAuctions = async () => {
    try {
      setLoading(true);
      const response = await getMyAuctions();
      const auctions = response?.data || [];
      
      // Process auctions to handle won/lost status
      const processedAuctions = auctions
        .filter(auction => auction && auction.car) // Filter out invalid auctions
        .map(auction => ({
          ...auction,
          _id: auction._id?.toString() || auction._id,
          car: auction.car ? {
            ...auction.car,
            _id: auction.car._id?.toString() || auction.car._id,
            images: auction.car.images || []
          } : null,
          currentBid: auction.currentPrice || 0,
          endTime: auction.endTime || new Date().toISOString()
        }));
      
      // Separate won and lost auctions
      const won = processedAuctions.filter(auction => 
        auction.status === 'ended' && auction.isWinner
      );
      
      const lost = processedAuctions.filter(auction => 
        auction.status === 'ended' && 
        !auction.isWinner && 
        auction.hasBid // Only show auctions where the user placed a bid
      );
      
      // Sort by end date (most recent first)
      const sortByEndDate = (a, b) => new Date(b.endTime) - new Date(a.endTime);
      setWonAuctions(won.sort(sortByEndDate));
      setLostAuctions(lost.sort(sortByEndDate));
      
      console.log('Processed auctions:', {
        total: processedAuctions.length,
        won: won.length,
        lost: lost.length
      });
      
    } catch (error) {
      console.error('Error loading auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAuctionCard = (auction) => {
    if (!auction || !auction.car) {
      console.warn('Invalid auction data:', auction);
      return null;
    }

    const carId = auction.car._id?.toString();
    const auctionId = auction._id?.toString();
    
    if (!carId || !auctionId) {
      console.warn('Missing required IDs:', { carId, auctionId });
      return null;
    }

    // Construct the full image URL
    const imageUrl = auction.car.images && auction.car.images.length > 0
      ? `${API_URL}${auction.car.images[0]}`
      : '';

    console.log('MyAuctionsScreen - Rendering auction:', {
      id: auctionId,
      car: auction.car,
      imageUrl,
      currentPrice: auction.currentPrice,
      isWinner: auction.isWinner
    });

    return (
      <TouchableOpacity 
        style={styles.auctionCard}
        onPress={() => navigation.navigate('CarDetail', { carId, auctionId })}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.carImage}
          defaultSource={require('../assets/car-placeholder.jpg')}
        />
        <View style={styles.cardContent}>
          <Text style={styles.carTitle}>
            {auction.car.make} {auction.car.model} {auction.car.year}
          </Text>
          <View style={styles.auctionDetails}>
            <View style={styles.priceContainer}>
              <Icon name="pricetag-outline" size={16} color="#007AFF" />
              <Text style={styles.finalPrice}>
                ${(auction.currentPrice || 0).toLocaleString()}
              </Text>
            </View>
            <Text style={styles.date}>
              {auction.endTime 
                ? `Ended ${new Date(auction.endTime).toLocaleDateString()}`
                : 'End date not available'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Won Auctions</Text>
          {wonAuctions.length > 0 ? (
            wonAuctions.map(auction => (
              <React.Fragment key={auction._id}>
                {renderAuctionCard(auction)}
              </React.Fragment>
            ))
          ) : (
            <Text style={styles.emptyText}>No auctions won yet</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lost Auctions</Text>
          {lostAuctions.length > 0 ? (
            lostAuctions.map(auction => (
              <React.Fragment key={auction._id}>
                {renderAuctionCard(auction)}
              </React.Fragment>
            ))
          ) : (
            <Text style={styles.emptyText}>No lost auctions</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  auctionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  carImage: {
    width: '100%',
    height: 150,
  },
  cardContent: {
    padding: 16,
  },
  carTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  auctionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  finalPrice: {
    marginLeft: 4,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  date: {
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default MyAuctionsScreen;
