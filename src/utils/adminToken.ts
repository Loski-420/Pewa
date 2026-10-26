export const getAdminToken = (promptIfMissing = false): string => {
  let t = sessionStorage.getItem('pewa_admin_token') || '';
  if (!t && promptIfMissing) {
    t = (window.prompt('Enter admin publish token') || '').trim();
    if (t) sessionStorage.setItem('pewa_admin_token', t);
  }
  return t;
};
export const clearAdminToken = () => sessionStorage.removeItem('pewa_admin_token');