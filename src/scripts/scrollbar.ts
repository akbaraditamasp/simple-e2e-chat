import Alpine from "alpinejs";
import { OverlayScrollbars } from "overlayscrollbars";
import "overlayscrollbars/overlayscrollbars.css";

Alpine.data("overlayScroll", () => ({
  instance: null as OverlayScrollbars | null,
  init() {
    this.instance = OverlayScrollbars(this.$el, {
      scrollbars: { autoHide: "leave" },
    });
  },
}));
