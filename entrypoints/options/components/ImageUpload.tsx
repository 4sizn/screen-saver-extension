import React, { useState } from 'react';
import { compressImage, validateImageFile } from '@/lib/imageProcessing';
import { saveImage } from '@/lib/imageStorage';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploading(true);

    try {
      // Show preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Compress image
      const compressedBlob = await compressImage(file);

      // Save to IndexedDB
      const id = crypto.randomUUID();
      await saveImage(id, compressedBlob, file.name);

      // Show success with size comparison
      const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
      const compressedSizeMB = (compressedBlob.size / 1024 / 1024).toFixed(2);
      alert(
        `Image uploaded successfully!\n\nOriginal: ${originalSizeMB}MB\nCompressed: ${compressedSizeMB}MB`
      );

      // Clean up
      URL.revokeObjectURL(previewUrl);
      setPreview(null);
      e.target.value = ''; // Reset input

      // Trigger parent refresh (event for ImageList)
      window.dispatchEvent(new CustomEvent('image-uploaded'));
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Custom Images</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            id="image-upload"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <Button disabled={uploading} asChild>
              <span>
                {uploading ? 'Compressing...' : 'Choose Image'}
              </span>
            </Button>
          </label>

          {preview && (
            <div className="mt-4">
              <img
                src={preview}
                alt="Preview"
                className="max-w-md mx-auto rounded-lg shadow-lg"
              />
            </div>
          )}

          <p className="mt-4 text-sm text-gray-500">
            Supported: JPEG, PNG, WebP (max 10MB)
            <br />
            Images optimized to 1920x1080, ~500KB
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
