import React, { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getAllImages, deleteImage, reorderImages, toggleImageEnabled } from '@/lib/imageStorage';
import type { ImageRecord } from '@/lib/imageStorage';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/useTranslation';

function SortableImage({
  item,
  onDelete,
  onToggle,
}: {
  item: ImageRecord;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const [objectUrl, setObjectUrl] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(item.blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [item.blob]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-4 rounded-lg border bg-white p-4 mb-2 shadow-sm",
        !item.isEnabled && "opacity-60"
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 3h2v2H9V3zm0 4h2v2H9V7zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm0 4h2v2H9v-2zm4-16h2v2h-2V3zm0 4h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z" />
        </svg>
      </div>

      {/* Thumbnail with visual indicator for default images */}
      <div className="relative">
        <img
          src={objectUrl}
          alt={item.name}
          className={`w-20 h-20 object-cover rounded ${
            item.isDefault ? 'ring-2 ring-blue-500' : ''
          }`}
        />
        {/* VISUAL INDICATOR: Badge overlay for default images */}
        {item.isDefault && (
          <div className="absolute top-0 left-0 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-br">
            {t('defaultBadge')}
          </div>
        )}
      </div>

      {/* Image info */}
      <div className="flex-1">
        <p className="font-medium text-gray-900">{item.name}</p>
        {item.isDefault && (
          <div className="flex items-center gap-1 mt-1">
            {/* Shield icon for additional visual cue */}
            <svg
              className="w-4 h-4 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs text-blue-600">{t('bundledImage')}</span>
          </div>
        )}
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center gap-2">
        <Switch
          id={`enable-${item.id}`}
          checked={item.isEnabled}
          onCheckedChange={() => onToggle(item.id)}
        />
        <Label
          htmlFor={`enable-${item.id}`}
          className="text-sm cursor-pointer"
        >
          {item.isEnabled ? t('enabledLabel') : t('disabledLabel')}
        </Label>
      </div>

      {/* Delete button (only for custom images) */}
      {!item.isDefault && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(item.id)}
        >
          {t('deleteButton')}
        </Button>
      )}
    </div>
  );
}

export default function ImageList() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ImageRecord[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadImages();

    // Refresh on upload
    const handleUpload = () => loadImages();
    window.addEventListener('image-uploaded', handleUpload);
    return () => window.removeEventListener('image-uploaded', handleUpload);
  }, []);

  async function loadImages() {
    const images = await getAllImages();
    setItems(images);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Persist new order to IndexedDB
        reorderImages(newItems.map((i) => i.id));

        return newItems;
      });
    }
  }

  async function handleDelete(id: string) {
    if (confirm(t('deleteConfirm'))) {
      try {
        await deleteImage(id);
        await loadImages();
      } catch (error) {
        alert(t('cannotDeleteDefault'));
      }
    }
  }

  async function handleToggle(id: string) {
    await toggleImageEnabled(id);
    await loadImages();
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>{t('yourImagesTitle')} ({items.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {t('noImagesMessage')}
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item) => (
                <SortableImage
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
