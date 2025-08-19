import moment from 'moment-jalaali';
import 'moment/locale/fa';
import momentTz from 'moment-timezone';

// تنظیم پیش‌فرض‌های زبان فارسی
moment.locale('fa');
moment.loadPersian();

/**
 * تاریخ و زمان فعلی به فرمت شمسی با منطقه‌ی تهران
 * @param {string} format - قالب نمایش تاریخ (پیش‌فرض: 'jYYYY/jMM/jDD HH:mm:ss')
 * @returns {string} - تاریخ شمسی فرمت شده
 */
export function persianNow(format = 'jYYYY/jMM/jDD HH:mm:ss') {
  return momentTz().tz('Asia/Tehran').format(format);
}

/**
 * ذخیره‌ی تاریخ به فرمت میلادی برای دیتابیس
 * @returns {string} - تاریخ میلادی در فرمت ISO
 */
export function gregorianNowISO() {
  return new Date().toISOString();
}

/**
 * تبدیل تاریخ میلادی به شمسی
 * @param {string|Date} date - تاریخ میلادی (رشته یا آبجکت Date)
 * @param {string} format - قالب خروجی شمسی
 * @returns {string} - تاریخ شمسی فرمت شده
 */
export function toJalali(date, format = 'jYYYY/jMM/jDD HH:mm:ss') {
  if (!date) return '';
  return moment(date).format(format);
}

/**
 * تبدیل تاریخ شمسی به میلادی
 * @param {string} jalaliDate - تاریخ شمسی (مثال: '۱۴۰۲/۰۶/۱۵')
 * @param {string} jalaliFormat - قالب ورودی شمسی
 * @param {string} outputFormat - قالب خروجی میلادی
 * @returns {string} - تاریخ میلادی فرمت شده
 */
export function toGregorian(
  jalaliDate, 
  jalaliFormat = 'jYYYY/jMM/jDD',
  outputFormat = 'YYYY-MM-DD'
) {
  if (!jalaliDate) return '';
  return moment.from(jalaliDate, 'fa', jalaliFormat).format(outputFormat);
}

/**
 * نمایش مناسب تاریخ و زمان شمسی برای کاربر
 * @param {string|Date} date - تاریخ میلادی ذخیره شده در دیتابیس
 * @returns {string} - تاریخ شمسی فرمت شده
 */
export function formatPersianDateTime(date) {
  if (!date) return '';
  
  // اگر تاریخ به صورت رشته باشد و فرمت ISO نباشد
  if (typeof date === 'string' && !date.includes('T')) {
    // احتمالاً قبلاً با persianNow ذخیره شده بود
    return date;
  }
  
  return toJalali(date, 'jYYYY/jMM/jDD HH:mm');
}

/**
 * نمایش مناسب تاریخ شمسی بدون زمان
 * @param {string|Date} date - تاریخ میلادی
 * @returns {string} - تاریخ شمسی فرمت شده
 */
export function formatPersianDate(date) {
  if (!date) return '';
  return toJalali(date, 'jYYYY/jMM/jDD');
}


