import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';
import { getLocalStorageCart, saveLocalStorageCartProduct } from '../util/storage';

interface CartProviderProps {
	children: ReactNode;
}

interface UpdateProductAmount {
	productId: number;
	amount: number;
}

interface CartContextData {
	cart: Product[];
	addProduct: (productId: number) => Promise<void>;
	removeProduct: (productId: number) => void;
	updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
	const [cart, setCart] = useState<Product[]>(getLocalStorageCart);

	console.log('Olha o carrinho:');
	console.table(cart);

	const verifyStockProductAmount = async (productId: number) => {
		const {
			data: { amount },
		} = await api.get(`stock/${productId}`);
		if (amount <= 0) return toast.error('Quantidade solicitada fora de estoque');
		return amount;
	};

	const addProduct = async (productId: number) => {
		try {
			const stockAmount = await verifyStockProductAmount(productId);
			const { data } = await api.get(`products/${productId}`);
			// setCart([{ ...data, amount: 1 }]);
			saveLocalStorageCartProduct({ ...data, amount: 1 });
			setCart(getLocalStorageCart());
		} catch {
			toast.error('Erro na adição do produto');
		}
	};

	const removeProduct = (productId: number) => {
		try {
			const newCart = cart.filter((product) => product.id !== productId);
			localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
			return setCart(getLocalStorageCart());
		} catch {
			toast.error('Erro na remoção do produto');
		}
	};

	const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
		try {
			const stockAmount = await verifyStockProductAmount(productId);
			const index = cart.findIndex((product) => product.id === productId);
			if (index !== -1) {
				if (amount > stockAmount) return toast.error('Quantidade solicitada fora de estoque');
				const cart = getLocalStorageCart();
				const newCart = cart.map((product: Product) => (product.id === productId ? { ...product, amount } : product));
				// setCart(newCart);
				localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
				return setCart(getLocalStorageCart());
			}
			toast.error('Erro na alteração de quantidade do produto');
		} catch {
			toast.error('Erro na alteração de quantidade do produto');
		}
	};

	return (
		<CartContext.Provider value={{ cart, addProduct, removeProduct, updateProductAmount }}>
			{children}
		</CartContext.Provider>
	);
}

export function useCart(): CartContextData {
	return useContext(CartContext);
}
