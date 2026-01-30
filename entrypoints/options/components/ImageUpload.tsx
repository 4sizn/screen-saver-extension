import React, { useState, useRef } from 'react';
import { compressImage, validateImageFile } from '@/lib/imageProcessing';
import { saveImage } from '@/lib/imageStorage';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/lib/useTranslation';

export default function ImageUpload() {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        `${t('uploadSuccess')}\n\n${t('originalSize')}: ${originalSizeMB}MB\n${t('compressedSize')}: ${compressedSizeMB}MB`
      );

      // Clean up
      URL.revokeObjectURL(previewUrl);
      setPreview(null);
      e.target.value = ''; // Reset input

      // Trigger parent refresh (event for ImageList)
      window.dispatchEvent(new CustomEvent('image-uploaded'));
    } catch (error) {
      console.error('Upload failed:', error);
      alert(t('uploadFailed'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('uploadImagesTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? t('compressingButton') : t('chooseImageButton')}
          </Button>

          {preview && (
            <div className="mt-4">
              <img
                src={preview}
                alt={t('previewAlt')}
                className="max-w-md mx-auto rounded-lg shadow-lg"
              />
            </div>
          )}

          <p className="mt-4 text-sm text-gray-500">
            {t('supportedFormats')}
            <br />
            {t('imageOptimization')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
