export async function uploadImage(file: File): Promise<string> {
  const apiKey = (import.meta as any).env.VITE_IMGBB_API_KEY || 'a16fdd9aead1214d64e435c9b83a0c2e';
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('فشل رفع الصورة');
    }

    const result = await response.json();
    return result.data.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}
