"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { formatCatId, formatDate } from "@/lib/format";
import { PawMark } from "@/components/PawMark";

export type PopupImage = {
  url: string;
  catId: number;
  catName: string;
  ownerName: string;
  uploadedAt: Date;
};

/** 肉球がぱっと弾けるかわいいエフェクト用の配置。 */
const PAW_BURST = [
  { x: -130, y: -90, r: -25, d: 0 },
  { x: 140, y: -70, r: 18, d: 0.04 },
  { x: -150, y: 80, r: 12, d: 0.08 },
  { x: 120, y: 110, r: -18, d: 0.06 },
  { x: 0, y: -150, r: 0, d: 0.02 },
];

export function ImagePopup({
  image,
  onClose,
}: {
  image: PopupImage | null;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`${image.catName} の写真`}
        >
          {/* 背景 */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* 肉球バースト */}
          {!reduce &&
            PAW_BURST.map((p, i) => (
              <motion.span
                key={i}
                className="pointer-events-none absolute text-primary"
                initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.1, 0.9],
                  x: p.x,
                  y: p.y,
                  rotate: p.r,
                }}
                transition={{ duration: 0.55, delay: p.d, ease: "easeOut" }}
              >
                <PawMark className="size-8 drop-shadow" />
              </motion.span>
            ))}

          {/* 画像本体 */}
          <motion.figure
            className="relative z-10 flex max-h-full max-w-3xl flex-col"
            initial={
              reduce
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.6, rotate: -4 }
            }
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={onClose}
          >
            <div className="relative overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-white/10">
              <Image
                src={image.url}
                alt={`${image.catName} の写真`}
                width={1200}
                height={1200}
                className="max-h-[78vh] w-auto object-contain"
                priority
              />
            </div>
            <figcaption className="catalog-no mt-3 flex items-center justify-center gap-3 text-xs text-white/80">
              <span className="font-heading text-sm tracking-wide text-white">
                {image.catName}
              </span>
              <span>No.{formatCatId(image.catId)}</span>
              <span>·</span>
              <span>{image.ownerName}</span>
              <span>·</span>
              <span>{formatDate(image.uploadedAt)}</span>
            </figcaption>
            <p className="mt-1 text-center text-[0.7rem] text-white/50">
              画像をクリックで閉じる
            </p>
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
