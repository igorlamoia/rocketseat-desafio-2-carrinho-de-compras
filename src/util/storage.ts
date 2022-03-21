export const getLocalStorageCart = () => {
	const cartString = localStorage.getItem('@RocketShoes:cart');
	if (!!cartString) return JSON.parse(cartString);
	return [];
};
