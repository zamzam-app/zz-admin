export const Logo: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#1F2937" stroke="#D4AF37" strokeWidth="2" />
    <circle cx="50" cy="50" r="42" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="4 2" />
    <path id="curveTop" d="M 20 50 A 30 30 0 0 1 80 50" fill="transparent"/>
    <text textAnchor="middle" fill="#D4AF37" fontSize="11" fontWeight="bold" fontFamily="serif" letterSpacing="1">
      <textPath href="#curveTop" startOffset="50%">ZAM ZAM</textPath>
    </text>
    <path d="M40 40 L60 40 L40 65 L60 65" stroke="#D4AF37" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="50" y="80" textAnchor="middle" fill="#D4AF37" fontSize="7" fontFamily="serif" letterSpacing="1">WEB-APP</text>
  </svg>
);