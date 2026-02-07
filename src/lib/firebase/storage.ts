import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

export async function uploadReceiptImage(
  userId: string,
  file: File | Blob
): Promise<string> {
  const timestamp = Date.now();
  const ext = file instanceof File ? file.name.split('.').pop() || 'jpg' : 'jpg';
  const path = `receipts/${userId}/${timestamp}.${ext}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function deleteReceiptImage(imageUrl: string): Promise<void> {
  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Failed to delete receipt image:', error);
  }
}
