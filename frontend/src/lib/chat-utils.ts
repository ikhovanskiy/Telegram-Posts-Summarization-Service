import type { Chat } from './types';

export function createChatImageHandler() {
	let imageErrors = new Set<string>();

	function handleImageError(chatId: string) {
		imageErrors.add(chatId);
		imageErrors = imageErrors;
	}

	function shouldShowImage(chat: Chat): boolean {
		if (!chat.photoUrl || imageErrors.has(chat.id)) {
			return false;
		}
		
		if (chat.photoUrl.startsWith('data:image/jpeg;base64,')) {
			const base64Data = chat.photoUrl.split(',')[1];
			if (!base64Data || base64Data.length < 100) {
				return false;
			}
		}
		
		return true;
	}

	return {
		handleImageError,
		shouldShowImage,
		getImageErrors: () => imageErrors
	};
}