import { Product } from '../types';

export const getLocalStorageCart = () => {
	const cartString = localStorage.getItem('@RocketShoes:cart');
	if (!!cartString) return JSON.parse(cartString);
	return [];
};

export const saveLocalStorageCartProduct = (product: Product) => {
	const cart = getLocalStorageCart();
	if (cart.length !== 0) {
		return localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, product]));
	}

	localStorage.setItem('@RocketShoes:cart', JSON.stringify([product]));
};
