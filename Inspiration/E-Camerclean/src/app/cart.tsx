import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  TouchableOpacity,
  FlatList,
  Image,
  ImageSourcePropType,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useCartStore } from '../store/cart-store';
import { usePaymentStore } from '../paymentStore';

type CartItemType = {
  id: number;
  title: string;
  heroImage: ImageSourcePropType;
  price: number;
  quantity: number;
  maxQuantity: number;
};

type CartItemProps = {
  item: CartItemType;
  onRemove: (id: number) => void;
  onIncrement: (id: number) => void;
  onDecrement: (id: number) => void;
};

const CartItem = ({ item, onDecrement, onIncrement, onRemove }: CartItemProps) => {
  return (
    <View style={styles.cartItem}>
      <Image
        source={typeof item.heroImage === 'string' ? { uri: item.heroImage } : item.heroImage}
        style={styles.itemImage}
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity onPress={() => onDecrement(item.id)} style={styles.quantityButton}>
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.itemQuantity}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => onIncrement(item.id)} style={styles.quantityButton}>
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity onPress={() => onRemove(item.id)} style={styles.removeButton}>
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function cart() {
  const { items, removeItem, incrementItem, decrementItem, getTotalPrice } = useCartStore();

  const {
    createQuote,
    submitCollect,
    checkPaymentStatus,
    loading: paymentLoading,
  } = usePaymentStore();

  // Dummy customer info - replace with your own form/input UI later
  const [customerPhoneNumber] = useState('237681464222');
  const [customerEmail] = useState('devert@test.com');
  const [customerName] = useState('Devert');
  const [customerAddress] = useState('Mambanda Bonaberi');
  const [serviceNumber] = useState('677389120');
  const [trid] = useState('10001001'); // transaction id - ideally generate dynamically

  // Dummy payItemId - replace with your product's payItemId mapping
  const payItemId = 'S-112-949-MTNMOMO-20053-200050001-1';

  // Ensure totalAmount is number, fallback 0
  const totalAmountRaw = getTotalPrice();
  const totalAmount = typeof totalAmountRaw === 'string' ? parseFloat(totalAmountRaw) : totalAmountRaw || 0;

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Cart is empty', 'Please add some products before checking out.');
      return;
    }

    try {
      // 1. Create Quote
      const quoteResponse = await createQuote(payItemId, totalAmount);

      if (!quoteResponse || !('quoteId' in quoteResponse)) {
        Alert.alert('Error', 'Failed to create payment quote.');
        return;
      }

      const quoteId = quoteResponse.quoteId as string;
      if (typeof quoteId !== 'string' || !quoteId) {
        Alert.alert('Error', 'Invalid quote ID.');
        return;
      }

      // 2. Submit Collect with customer info
      const ptn = await submitCollect(
        quoteId,
        customerPhoneNumber,
        customerEmail,
        customerName,
        customerAddress,
        serviceNumber,
        trid
      );

      if (!ptn) {
        Alert.alert('Error', 'Failed to submit collect/payment request.');
        return;
      }

      // 3. Poll payment status using PTN (max 10 tries, 3 seconds interval)
      const maxAttempts = 10;
      let attempts = 0;
      let paymentResult: { status?: string }[] | null = null;

      while (attempts < maxAttempts) {
        paymentResult = await checkPaymentStatus(ptn);
        console.log(`Attempt ${attempts + 1} - Payment Status Response:`, paymentResult);

        if (paymentResult && Array.isArray(paymentResult) && paymentResult.length > 0) {
          const status = paymentResult[0].status;
          console.log(`Attempt ${attempts + 1}: Payment status is ${status}`);

          if (status === 'SUCCESS') {
            Alert.alert('Payment Success', 'Your payment was successful!');
            break;
          } else if (status === 'FAILED') {
            Alert.alert('Payment Failed', 'Payment was not successful. Please try again.');
            break;
          }
        } else {
          console.warn(`Attempt ${attempts + 1}: Invalid payment status response`, paymentResult);
        }

        attempts++;
        await new Promise(res => setTimeout(res, 3000));
      }

      if (attempts === maxAttempts) {
        Alert.alert(
          'Payment Pending',
          'Payment is still pending. Please check again later or contact support.'
        );
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      Alert.alert('Error', error.message || 'Payment process failed.');
    }
  };


  return (
    <View style={styles.container}>
      <StatusBar style={Platform.OS === 'android' ? 'dark' : 'auto'} />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <CartItem
            item={item}
            onRemove={removeItem}
            onIncrement={incrementItem}
            onDecrement={decrementItem}
          />
        )}
        contentContainerStyle={styles.cartList}
      />

      <View style={styles.footer}>
        <Text style={styles.totalText}>Total: {totalAmount} FCFA</Text>
        <TouchableOpacity
          onPress={handleCheckout}
          style={[styles.checkoutButton, paymentLoading && { opacity: 0.6 }]}
          disabled={paymentLoading}
        >
          {paymentLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.checkoutButtonText}>Checkout</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  cartList: {
    paddingVertical: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    color: '#888',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    padding: 8,
    backgroundColor: '#ff5252',
    borderRadius: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  checkoutButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: '#ddd',
    marginHorizontal: 5,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
