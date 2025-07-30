// lib/persianNow.js
import moment from 'moment-timezone';
import 'moment/locale/fa';
import 'moment-jalaali';

export function persianNow() {
  return moment.tz('Asia/Tehran')     // منطقهٔ تهران
              .locale('fa')           // اعداد فارسی
              .format('jYYYY/jMM/jDD HH:mm:ss'); // ۱۴۰۴/۰۵/۰۹ ۱۵:۲۳:۱۰
}
