import moment from 'moment-timezone';

export function persianNow() {
  return moment().tz('Asia/Tehran').format('YYYY/MM/DD HH:mm:ss');
}
