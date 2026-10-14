'use client';

import Link from 'next/link';

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

export function ConsentCheckbox({ checked, onChange, id = 'consent' }: ConsentCheckboxProps) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-4 h-4 rounded border-gray-300"
        required
      />
      <span>
        Я прочитав(ла) та погоджуюся з{' '}
        <Link href="/terms-of-use" target="_blank" className="text-blue-600 hover:underline font-medium">
          Умовами використання
        </Link>{' '}
        і{' '}
        <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline font-medium">
          Політикою конфіденційності
        </Link>
        .
      </span>
    </label>
  );
}
