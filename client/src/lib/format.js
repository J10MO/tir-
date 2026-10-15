const num = new Intl.NumberFormat('en-US');

export const money = n => `${num.format(n)} د.ع`;

// Foot length in cm that an EU size fits (EU = 1.5 × (foot + 1.5)).
export const footCm = eu => (eu / 1.5 - 1.5).toFixed(1);

export const STATUS = {
  new: 'جديد',
  confirmed: 'مؤكد',
  shipped: 'مع المندوب',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

export const STATUS_ACTION = {
  confirmed: 'تأكيد الطلب',
  shipped: 'تسليم للمندوب',
  delivered: 'تم التسليم',
  cancelled: 'إلغاء الطلب',
};

const dateFmt = new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' });
export const date = d => dateFmt.format(new Date(d));

export const pairs = n => (n === 1 ? 'زوج واحد' : n === 2 ? 'زوجان' : n <= 10 ? `${n} أزواج` : `${n} زوجاً`);
