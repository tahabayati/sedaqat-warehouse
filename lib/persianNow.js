import moment from 'moment-timezone';
import { persianNow as newPersianNow } from './persianDate';

export function persianNow() {
  // برای حفظ سازگاری با کد قبلی همان فرمت را برمیگردانیم
  return moment().tz('Asia/Tehran').format('YYYY/MM/DD HH:mm:ss');
}

// اگر نیاز به استفاده از فانکشن جدید باشد:
export { newPersianNow };