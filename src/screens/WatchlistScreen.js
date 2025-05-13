import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import CarCard from '../components/CarCard';
import { getWatchlist, getAuctionByCarId } from '../services/api';
import Toast from 'react-native-toast-message';

const WatchlistScreen = ({ navigation }) => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      const response = await getWatchlist();
      const cars = response.data || [];
      // Fetch auction for each car
      const watchlistWithAuctions = await Promise.all(
        cars.map(async (car) => {
          try {
            const auction = await getAuctionByCarId(car._id);
            return { car, auction };
          } catch {
            return { car, auction: null };
          }
        })
      );
      setWatchlist(watchlistWithAuctions);
    } catch (error) {
      console.error('Error loading watchlist:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load watchlist',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadWatchlist();
  };

  const handleCarPress = async (carId) => {
    try {
      const auction = await getAuctionByCarId(carId);
      if (auction && auction._id) {
        navigation.navigate('CarDetail', { auctionId: auction._id });
      } else {
        Toast.show({
          type: 'error',
          text1: 'No auction found for this car',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch auction',
      });
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Watchlist</Text>
      <FlatList
        data={watchlist}
        renderItem={({ item }) => (
          <CarCard
            car={item.car}
            auction={item.auction}
            onPress={() => handleCarPress(item.car._id)}
          />
        )}
        keyExtractor={item => item.car._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Your watchlist is empty
          </Text>
        }
      />
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
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
    color: '#222',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 24,
  },
});

export default WatchlistScreen; 