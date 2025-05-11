import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const API_URL = 'http://139.59.148.94:5001/api';

const CarCard = ({ car, auction, currentBid, endTime, onPress }) => {
  if (!car) {
    return null;
  }

  // Safely get the current price
  const getCurrentPrice = () => {
    const price = currentBid || (auction?.currentPrice) || (auction?.startingPrice) || 0;
    return price.toLocaleString();
  };

  // Safely get the car details with fallbacks
  const {
    make = '',
    model = '',
    year = '',
    mileage = 0,
    color = '',
    images = []
  } = car;

  // Construct full image URL
  const imageUrl = images[0] 
    ? `${API_URL}${images[0]}` 
    : 'https://via.placeholder.com/400';

  console.log('Image URL:', imageUrl); // For debugging

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={styles.title}>{make} {model}</Text>
        <Text style={styles.year}>{year}</Text>
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Icon name="speedometer-outline" size={16} color="#8E8E93" />
            <Text style={styles.detailText}>{mileage.toLocaleString()} miles</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="color-palette-outline" size={16} color="#8E8E93" />
            <Text style={styles.detailText}>{color}</Text>
          </View>
        </View>
        <View style={styles.bidContainer}>
          <Text style={styles.bidLabel}>Current Bid</Text>
          <Text style={styles.bidAmount}>${getCurrentPrice()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  year: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  details: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#8E8E93',
  },
  bidContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  bidLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  bidAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default CarCard;
