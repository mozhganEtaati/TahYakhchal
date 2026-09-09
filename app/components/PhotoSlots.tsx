"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ImagePlus, X } from "lucide-react";
import { fa } from "@/messages/fa";
import { MAX_PHOTOS, useSession, type SelectedPhoto } from "@/lib/session";

/** Three slots sitting on a shelf, like items in a fridge door. */
export default function PhotoSlots() {
  const { photos, addPhotos, removePhoto } = useSession();
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setNotice(null);

    const { rejected, overflow } = addPhotos(Array.from(fileList));
    if (rejected > 0) setNotice(fa.errors.INVALID_UPLOAD);
    else if (overflow) setNotice(fa.tooManyPhotos);

    if (inputRef.current) inputRef.current.value = "";
  }

  const slots = Array.from({ length: MAX_PHOTOS }, (_, index) => photos[index] ?? null);

  return (
    <section className="fridge-light rounded-[2rem] border border-hairline p-6 sm:p-8">
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {slots.map((photo, index) =>
          photo ? (
            <FilledSlot key={photo.id} photo={photo} onRemove={() => removePhoto(photo.id)} />
          ) : index === photos.length ? (
            <motion.label
              key={`add-${index}`}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              className="grid h-44 w-32 cursor-pointer place-items-center gap-2 rounded-2xl border border-nana/40 bg-taaqche/70 p-3 text-center text-sm text-mist transition-colors hover:border-nana hover:text-barf sm:h-48 sm:w-36"
            >
              <span className="grid size-11 place-items-center rounded-full bg-nana text-shab">
                <ImagePlus className="size-5" />
              </span>
              {fa.home.addPhoto}
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,.heic,.heif"
                multiple
                className="sr-only"
                onChange={(event) => handleFiles(event.target.files)}
              />
            </motion.label>
          ) : (
            <div
              key={`empty-${index}`}
              className="grid h-44 w-32 place-items-center gap-1 rounded-2xl border border-dashed border-hairline text-sm text-mist/60 sm:h-48 sm:w-36"
            >
              <span className="font-display text-3xl text-hairline">
                {(index + 1).toLocaleString("fa-IR")}
              </span>
              {fa.home.emptySlot}
            </div>
          ),
        )}
      </div>

      <div className="shelf-line mx-auto mt-6 h-px w-2/3" />

      <div className="mt-5 text-center">
        <p className="font-display text-lg">{fa.home.slotsTitle}</p>
        <p className="text-sm text-mist">{fa.home.slotsHint}</p>
      </div>

      <AnimatePresence>
        {notice && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 text-center text-sm text-destructive"
          >
            {notice}
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}

function FilledSlot({ photo, onRemove }: { photo: SelectedPhoto; onRemove: () => void }) {
  const [decodable, setDecodable] = useState(true);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="relative h-44 w-32 overflow-hidden rounded-2xl border border-hairline bg-taaqche sm:h-48 sm:w-36"
    >
      {decodable ? (
        // next/image cannot optimize a local blob: URL, and we need the raw onError
        // hook to detect an undecodable file (HEIC) and swap in the chip.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.previewUrl}
          alt={photo.file.name}
          onError={() => setDecodable(false)}
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full flex-col justify-center gap-1 break-all p-3 text-xs text-mist">
          <span className="text-barf">{photo.file.name}</span>
          <span>
            {(photo.file.size / (1024 * 1024)).toLocaleString("fa-IR", {
              maximumFractionDigits: 1,
            })}{" "}
            مگابایت
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={onRemove}
        aria-label={fa.removePhoto}
        className="absolute start-2 top-2 grid size-7 place-items-center rounded-full bg-shab/80 text-barf transition-colors hover:bg-destructive hover:text-shab"
      >
        <X className="size-4" />
      </button>
    </motion.div>
  );
}
