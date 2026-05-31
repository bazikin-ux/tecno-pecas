"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type ProductImageGalleryProps = {
  name: string;
  images: string[];
  fallbackImage: string;
};

export default function ProductImageGallery({
  name,
  images,
  fallbackImage,
}: ProductImageGalleryProps) {
  const galleryImages = useMemo(() => {
    const uniqueImages = Array.from(new Set(images.filter(Boolean)));
    return uniqueImages.length ? uniqueImages : [fallbackImage];
  }, [fallbackImage, images]);
  const [selectedImage, setSelectedImage] = useState(galleryImages[0]);
  const [previewImage, setPreviewImage] = useState("");

  const currentImage = galleryImages.includes(selectedImage)
    ? selectedImage
    : galleryImages[0];

  return (
    <>
      <div className="overflow-hidden rounded-xl bg-[#1e1f22]">
        <button
          type="button"
          onClick={() => setPreviewImage(currentImage)}
          className="block w-full cursor-zoom-in"
          aria-label="Abrir imagem ampliada"
        >
          <Image
            src={currentImage}
            alt={name}
            width={900}
            height={620}
            priority
            className="h-[360px] w-full bg-white object-contain p-5 md:h-[560px] md:p-8"
          />
        </button>

        {galleryImages.length > 1 && (
          <div className="grid gap-2 p-3 sm:grid-cols-4">
            {galleryImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setSelectedImage(image)}
                className={`rounded-lg border-2 bg-white p-1 transition ${
                  image === currentImage
                    ? "border-[#23a559]"
                    : "border-transparent hover:border-[#5865f2]"
                }`}
                aria-label={`Ver imagem ${index + 1}`}
              >
                <Image
                  src={image}
                  alt={`${name} - imagem ${index + 1}`}
                  width={180}
                  height={120}
                  className="h-24 w-full object-contain"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImage("")}
        >
          <div className="relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImage("")}
              className="absolute right-3 top-3 z-10 rounded-lg bg-[#da373c] px-4 py-2 font-black text-white hover:bg-[#b92d32]"
            >
              Fechar
            </button>
            <Image
              src={previewImage}
              alt={name}
              width={1200}
              height={900}
              className="max-h-[85vh] w-full rounded-xl bg-white object-contain p-4"
            />
          </div>
        </div>
      )}
    </>
  );
}
