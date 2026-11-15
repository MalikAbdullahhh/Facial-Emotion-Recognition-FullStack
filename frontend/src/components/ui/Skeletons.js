import React from 'react';

const S = ({ w = '100%', h = 16, r = 10, style }) => <span className="skeleton" style={{ display: 'block', width: w, height: h, borderRadius: r, ...style }} />;

export function SiteSkeleton() {
  return (
    <div className="container" style={{ minHeight: '80vh', padding: '72px 20px', display: 'grid', gap: 18, alignContent: 'start' }} aria-busy="true" aria-label="Loading">
      <S w={120} h={14} />
      <S w="min(640px, 90%)" h={64} r={14} />
      <S w="min(520px, 80%)" h={64} r={14} />
      <S w="min(420px, 70%)" h={18} style={{ marginTop: 10 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 40 }}>
        <S h={220} r={24} /><S h={220} r={24} /><S h={220} r={24} />
      </div>
    </div>
  );
}

export function AppSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'grid', gap: 10 }}><S w={110} h={14} /><S w={280} h={40} r={12} /><S w={360} h={14} /></div>
      <S h={112} r={24} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <S h={320} r={24} /><S h={320} r={24} />
      </div>
    </div>
  );
}

export function AuthSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div style={{ width: 'min(400px, 100%)', display: 'grid', gap: 16 }}>
        <S w={220} h={40} r={12} /><S w={260} h={14} />
        <S h={50} r={12} style={{ marginTop: 18 }} /><S h={50} r={12} /><S h={54} r={999} />
      </div>
    </div>
  );
}

export function CardsSkeleton({ count = 4, h = 220 }) {
  return Array.from({ length: count }).map((_, i) => <S key={i} h={h} r={18} />);
}

export default S;
