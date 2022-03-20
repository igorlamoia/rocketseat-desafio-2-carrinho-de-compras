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

	const verifyStockProductAmount = async (productId: number) => {
		const {
			data: { amount },
		} = await api.get(`stock/${productId}`);
		if (amount <= 0) return toast.error('Quantidade solicitada fora de estoque');
		return amount;
	};

	const addProduct = async (productId: number) => {
		try {
			const updatedCart = [...cart];
			const updatedProduct = updatedCart.find((product) => product.id === productId);
			if (updatedProduct) {
				await updateProductAmount({ productId, amount: updatedProduct.amount + 1 });
				return;
			}

			const { data } = await api.get(`products/${productId}`);
			saveLocalStorageCartProduct({ ...data, amount: 1 });
			setCart(getLocalStorageCart());
		} catch {
			toast.error('Erro na adição do produto');
		}
	};

	const removeProduct = (productId: number) => {
		try {
			const updatedCart = [...cart];
			const index = updatedCart.findIndex((product) => product.id === productId);
			if (index === -1) throw new Error();
			updatedCart.splice(index, 1);
			localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
			setCart(updatedCart);
		} catch {
			toast.error('Erro na remoção do produto');
		}
	};

	const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
		try {
			if (amount <= 0) return;
			const stock = await verifyStockProductAmount(productId);
			if (stock < amount) {
				toast.error('Quantidade solicitada fora de estoque');
				return;
			}

			const updatedCart = [...cart];
			const updatedProduct = updatedCart.find((product) => product.id === productId);

			if (!updatedProduct) throw new Error();
			updatedProduct.amount = amount;
			localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
			setCart(updatedCart);
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
