import Alpine from "alpinejs";

function preventDefaults(e: Event) {
  e.preventDefault();
  e.stopPropagation();
}

Alpine.data("dropzone", () => ({
  active: false,
  value: [] as File[],
  init() {
    const multiple = Boolean(this.$el.getAttribute("multiple"));

    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      this.$el.addEventListener(eventName, preventDefaults, false);
    });

    ["dragenter", "dragover"].forEach((eventName) => {
      this.$el.addEventListener(
        eventName,
        () => {
          this.active = true;
        },
        false,
      );
    });

    ["dragleave", "drop"].forEach((eventName) => {
      this.$el.addEventListener(
        eventName,
        () => {
          this.active = false;
        },
        false,
      );
    });

    this.$el.addEventListener(
      "drop",
      (e) => {
        const dt = e.dataTransfer;
        const files = dt?.files;

        if (files) {
          if (multiple) {
            const tempFile: File[] = [];
            for (const file of files) {
              tempFile.push(file);
            }

            this.value = tempFile;
          } else {
            this.value = [files[0]];
          }
        }
      },
      false,
    );

    const input = document.createElement("input");
    input.type = "file";
    input.multiple = multiple;

    input.addEventListener("change", (e) => {
      const files = (e.target as HTMLInputElement).files;

      if (files) {
        if (multiple) {
          const tempFile: File[] = [];
          for (const file of files) {
            tempFile.push(file);
          }

          this.value = tempFile;
        } else {
          this.value = [files[0]];
        }
      }
    });

    this.$el.addEventListener("click", (e) => {
      e.preventDefault();
      input.click();
    });
  },
}));
