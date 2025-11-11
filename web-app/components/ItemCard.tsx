'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface ItemCardProps {
  item: {
    id: string;
    name: string;
    category: string;
    mainColor: string;
    brand: string;
    thumbnailUrl: string;
  };
}

export default function ItemCard({ item }: ItemCardProps) {
  return (
    <Link href={`/item/${item.id}`}>
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        className="surface rounded-xl overflow-hidden border border-custom hover:border-accent transition-all duration-200 cursor-pointer group"
      >
        {/* Image */}
        <div className="relative aspect-[3/4] bg-surface-light overflow-hidden">
          <Image
            src={item.thumbnailUrl}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-primary font-semibold text-sm mb-1 truncate">
            {item.name}
          </h3>
          <p className="text-secondary text-xs mb-2 truncate">
            {item.brand}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-secondary bg-surface-light px-2 py-1 rounded-full">
              {item.category}
            </span>
            <div
              className="w-5 h-5 rounded-full border-2 border-custom"
              style={{ backgroundColor: item.mainColor.toLowerCase() }}
              title={item.mainColor}
            />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
