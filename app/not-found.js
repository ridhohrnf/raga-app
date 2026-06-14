'use client';

import Link from 'next/link';
import { ArrowLeft, Dumbbell } from 'lucide-react';
import { Button } from 'antd';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-glow/10 rounded-full filter blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-60 h-60 bg-blue-500/5 rounded-full filter blur-[60px] pointer-events-none"></div>

      <div className="z-10 text-center max-w-md flex flex-col items-center gap-6 animate-slide-up">
        {/* App Logo Indicator */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-glow/30 to-purple/10 border border-white/10 flex items-center justify-center shadow-lg shadow-purple/5">
          <Dumbbell className="w-8 h-8 text-primary" />
        </div>

        {/* 404 Text */}
        <div className="flex flex-col gap-2">
          <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple to-[#2997ff] m-0 tracking-tight">
            404
          </h1>
          <h2 className="text-xl font-bold text-slate-200 m-0">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-xs text-muted leading-relaxed mt-1">
            Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan. Yuk, kembali ke jalan latihan Anda! 🏋️‍♂️
          </p>
        </div>

        {/* Actions */}
        <Link href="/" passHref legacyBehavior>
          <Button 
            type="primary" 
            size="large"
            icon={<ArrowLeft className="w-4 h-4 mr-1" />}
            className="h-11 rounded-xl px-6 font-semibold flex items-center justify-center text-xs shadow-md shadow-purple/10"
          >
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    </div>
  );
}
