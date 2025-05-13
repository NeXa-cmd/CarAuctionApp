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
import { getWatchlist } from '../services/api';
import Toast from 'react-native-toast-message';

const WatchlistScreen = ({ navigation }) => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      const response = await getWatchlist();
      setWatchlist(response.data || []);
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

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={watchlist}
        renderItem={({ item }) => (
          <CarCard
            car={item}
            onPress={() => navigation.navigate('CarDetail', { carId: item._id })}
          />
        )}
        keyExtractor={item => item._id}
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