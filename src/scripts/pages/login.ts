import Alpine from "alpinejs";
import validation from "../validation";
import vine from "@vinejs/vine";
import client from "../client";
import fileDownload from "js-file-download";
import Cookies from "js-cookie";
import Toastify from "toastify-js";
import main from "../main";

main(() => {
  if (Cookies.get("token")) {
    location.href = "/";
  }

  Alpine.store("loading", { status: false });
  Alpine.store("verify", async (file: File) => {
    (Alpine.store("loading") as { status: boolean }).status = true;
    await client
      .post("/auth/verify", file, {
        headers: {
          "Content-Type": "application/octet-stream",
        },
      })
      .then(({ data }) => {
        (Alpine.store("loading") as { status: boolean }).status = false;
        Cookies.set("token", data.token);
        Cookies.set("privateKey", data.privateKey);

        location.href = "/";
      })
      .catch(() => {
        (Alpine.store("loading") as { status: boolean }).status = false;
        Toastify({
          text: "Terjadi kesalahan",
          className: "!text-red-700 !rounded",
          style: {
            background: "#FFF",
          },
        }).showToast();
      });
  });

  Alpine.data(
    "register",
    validation(
      vine.object({
        displayName: vine.string(),
      }),
      async ({ displayName }) => {
        (Alpine.store("loading") as { status: boolean }).status = true;
        await client
          .post("/auth", { displayName })
          .then(({ data }) => {
            (Alpine.store("loading") as { status: boolean }).status = false;
            Cookies.set("token", data.token);
            Cookies.set("privateKey", data.privateKey);
            const download = JSON.stringify({
              cuid: data.cuid,
              privateKey: data.privateKey,
            });

            fileDownload(download, "auth-key.json");

            location.href = "/";
          })
          .catch(() => {
            (Alpine.store("loading") as { status: boolean }).status = false;
            Toastify({
              text: "Terjadi kesalahan",
              className: "!text-red-700 !rounded",
              style: {
                background: "#FFF",
              },
            }).showToast();
          });
      },
    ),
  );
});
