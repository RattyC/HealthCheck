'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body className="container-page py-10">
        <h2 className="text-xl font-semibold">เกิดข้อผิดพลาดขณะโหลดหน้า</h2>
        <p className="mt-2 text-sm text-gray-600">{error.message || 'Server error'} {error.digest ? `(Digest: ${error.digest})` : ''}</p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => reset()} className="rounded border px-3 py-1">ลองอีกครั้ง</button>
          <a href="/" className="rounded border px-3 py-1">กลับหน้าแรก</a>
        </div>
      </body>
    </html>
  );
}

