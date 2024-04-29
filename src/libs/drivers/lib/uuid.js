import { v4 as uuidv4 } from 'uuid';
import { customAlphabet } from 'nanoid/non-secure';
import { nanoid as nanoidSecure, customAlphabet as customAlphabetSecure } from 'nanoid';

// https://zelark.github.io/nano-id-cc/
// https://security.stackexchange.com/a/41749/1873
// > On the other hand, 128 bits (between 21 and 22 characters
// > alphanumeric) is beyond the reach of brute-force attacks pretty much
// > indefinitely
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 22);


export default {
	create: function() {
		return uuidv4().replace(/-/g, '');
	},
	createNano: function() {
		return nanoid();
	},
};

export const createSecureRandom = (size = 32) => {
	return nanoidSecure(size);
};

const cachedUuidgen = {};
const createUuidgenCustomAlphabet = (length) => customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', length);

const getCachedUuidgen = (length) => {
	if (cachedUuidgen[length]) return cachedUuidgen[length];

	cachedUuidgen[length] = createUuidgenCustomAlphabet(length);
	return cachedUuidgen[length];
};

export const uuidgen = (length = 22) => {
	const cachedUuidgen = getCachedUuidgen(length);
	return cachedUuidgen();
};

export const createNanoForInboxEmail = () => {
	return customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8)();
};

export { customAlphabetSecure };
