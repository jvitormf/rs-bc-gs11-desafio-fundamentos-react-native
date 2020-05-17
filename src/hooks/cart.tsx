import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cart = await AsyncStorage.getItem('@GoMarketplace:cart');

      if (cart) {
        setProducts(JSON.parse(cart));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const productExists = products.find(item => product.id === item.id);

      if (!productExists) {
        setProducts([
          ...products,
          {
            id: product.id,
            title: product.title,
            image_url: product.image_url,
            price: product.price,
            quantity: 1,
          },
        ]);

        await AsyncStorage.setItem(
          '@GoMarketplace:cart',
          JSON.stringify(product),
        );
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const cartItems: Product[] = [...products];

      const cartItemIndex = products.findIndex(product => product.id === id);

      cartItems[cartItemIndex].quantity += 1;

      setProducts(cartItems);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(cartItems),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const cartItems: Product[] = [...products];

      const cartItemIndex = products.findIndex(product => product.id === id);

      if (cartItems[cartItemIndex].quantity > 1) {
        cartItems[cartItemIndex].quantity -= 1;
      }

      setProducts(cartItems);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(cartItems),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
