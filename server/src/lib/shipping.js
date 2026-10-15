// Delivery fees in Iraqi dinar, cash on delivery.
export const GOVERNORATES = [
  'بغداد', 'البصرة', 'نينوى', 'أربيل', 'السليمانية', 'دهوك', 'كركوك', 'الأنبار', 'بابل',
  'كربلاء', 'النجف', 'واسط', 'ديالى', 'صلاح الدين', 'القادسية', 'ذي قار', 'ميسان', 'المثنى',
];

export const BAGHDAD_FEE = 5000;
export const OTHER_FEE = 8000;

export const deliveryFee = governorate => (governorate === 'بغداد' ? BAGHDAD_FEE : OTHER_FEE);
