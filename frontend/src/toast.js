import { toast } from 'react-toastify';

let settings = {};

export const setToastSettings = (s) => { settings = s || {}; };

const toastWrapper = {
  success: (msg, opts) => {
    if (settings.showSuccess === false) return;
    return toast.success(msg, opts);
  },
  error: (msg, opts) => {
    if (settings.showErrors === false) return;
    return toast.error(msg, opts);
  },
  warning: (msg, opts) => toast.warning(msg, opts),
  info: (msg, opts) => toast.info(msg, opts),
};

export default toastWrapper;
