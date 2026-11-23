import Link from 'next/link';
import { Fragment } from 'react';

const TAG = /(#[A-Za-z0-9_\u00C0-\u024F\u0400-\u04FF]{2,40})/g;

/** Текст допису: хештеги (#слово) стають посиланнями на пошук по дописах. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(TAG);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('#') && part.length > 2 ? (
          <Link key={i} href={`/search?q=${encodeURIComponent(part)}&type=posts`} className="text-primary-600 hover:underline">{part}</Link>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}
