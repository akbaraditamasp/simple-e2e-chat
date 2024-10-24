import "iconify-icon";
import "toastify-js/src/toastify.css";
import AlpineJS, { Alpine } from "alpinejs";

import "./dropzone";
import "./scrollbar";
import "./rand-color";

export default function main(callback: () => void) {
  callback();

  (window as unknown as { Alpine: Alpine }).Alpine = AlpineJS;

  AlpineJS.start();
}
