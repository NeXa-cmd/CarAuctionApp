import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import SearchBar from '../components/SearchBar';
import CarCard from '../components/CarCard';
import { getLiveAuctions, getUpcomingAuctions } from '../services/api';

const HomeScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [upcomingAuctions, setUpcomingAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      console.log('Fetching auctions...');
      
      const [liveResponse, upcomingResponse] = await Promise.all([
        getLiveAuctions(),
        getUpcomingAuctions()
      ]);
      
      console.log('Live auctions response:', liveResponse);
      console.log('Upcoming auctions response:', upcomingResponse);
      
      // Extract data from response
      const live = liveResponse?.data || [];
      const upcoming = upcomingResponse?.data || [];
      
      console.log('Processed live auctions:', live);
      console.log('Processed upcoming auctions:', upcoming);
      
      setLiveAuctions(live);
      setUpcomingAuctions(upcoming);
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAuctions();
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  const filteredLiveAuctions = liveAuctions.filter(auction =>
    auction?.car?.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    auction?.car?.model?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUpcomingAuctions = upcomingAuctions.filter(auction =>
    auction?.car?.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    auction?.car?.model?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search cars..."
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Auctions</Text>
        {filteredLiveAuctions.length > 0 ? (
          filteredLiveAuctions.map((auction) => (
            <CarCard
              key={auction._id}
              auction={auction}
              car={auction.car}
              currentBid={auction.currentPrice}
              endTime={auction.endTime}
              onPress={() => navigation.navigate('CarDetail', { 
                carId: auction.car._id,
                auctionId: auction._id,
                isActive: true
              })}
            />
          ))
        ) : (
          <Text style={styles.noAuctionsText}>No live auctions available</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Auctions</Text>
        {filteredUpcomingAuctions.length > 0 ? (
          filteredUpcomingAuctions.map((auction) => (
            <CarCard
              key={auction._id}
              auction={auction}
              car={auction.car}
              currentBid={auction.startingPrice}
              endTime={auction.endTime}
              onPress={() => navigation.navigate('CarDetail', { 
                carId: auction.car._id,
                auctionId: auction._id,
                isActive: false
              })}
            />
          ))
        ) : (
          <Text style={styles.noAuctionsText}>No upcoming auctions available</Text>
        )}
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000000',
  },
  noAuctionsText: {
    textAlign: 'center',
    color: '#8E8E93',
    marginTop: 16,
  },
});

export default HomeScreen;
