import Alpine from "alpinejs";
import Cookies from "js-cookie";
import { RxDatabase, RxDocument, createRxDatabase } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { Socket, io } from "socket.io-client";
import conversationSchema from "../../schema/chat";
import client from "../client";
import { EncryptedMsg, decrypt, encrypt } from "../encryption";
import main from "../main";
import audioSrc from "../../assets/audio/notif.wav";

main(() => {
  const audioElement = new Audio(audioSrc);

  type User = {
    cuid: string;
    displayName: string;
  };

  Alpine.store("rxdb", {
    db: null,
    async begin() {
      const db = await createRxDatabase({
        name: "simple-e2e",
        storage: getRxStorageDexie(),
      });

      await db.addCollections({
        conversations: {
          schema: conversationSchema,
        },
      });

      (Alpine.store("rxdb") as { db: RxDatabase }).db = db;

      (Alpine.store("socket") as { io: Socket }).io.on(
        "chat",
        async (data: EncryptedMsg) => {
          audioElement.play();
          const chat = decrypt(data);

          const conversation = await (
            Alpine.store("rxdb") as { db: RxDatabase }
          ).db.conversations
            .findOne(chat.sender.cuid)
            .exec();

          let document: RxDocument<{ chats: any[] }>;

          if (!conversation) {
            document = await (
              Alpine.store("rxdb") as { db: RxDatabase }
            ).db.conversations.insert({
              cuid: chat.sender.cuid,
              conversationInfo: {
                cuid: chat.sender.cuid,
                displayName: chat.sender.displayName,
              },
              chats: [chat],
            });
          } else {
            const copy = conversation.chats.slice(0);
            copy.push(chat);

            document = await (
              conversation as RxDocument<{ chats: any[] }>
            ).patch({
              chats: copy,
            });
          }

          if (
            (
              Alpine.store("watchedConversation") as {
                cuid: string;
              }
            ).cuid === chat.sender.cuid
          ) {
            (
              Alpine.store("watchedConversation") as {
                conversation: any;
              }
            ).conversation = document;
          }

          await (
            Alpine.store("chatList") as { begin: () => Promise<void> }
          ).begin();
        },
      );

      (Alpine.store("socket") as { io: Socket }).io.emit("get:sync");

      await (
        Alpine.store("chatList") as { begin: () => Promise<void> }
      ).begin();
    },
  });

  Alpine.store("user", {
    data: null,
    loading: false,
    init() {
      if (!Cookies.get("token")) {
        location.href = "/login";
        return;
      }

      (Alpine.store("user") as { loading: boolean }).loading = true;

      client
        .get("/auth", {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        })
        .then(({ data }) => {
          (async () => {
            await (
              Alpine.store("rxdb") as { begin: () => Promise<void> }
            ).begin();

            client.defaults.headers.common.Authorization = `Bearer ${Cookies.get("token")}`;
            (Alpine.store("user") as { loading: boolean }).loading = false;

            (Alpine.store("user") as { data: User }).data = {
              cuid: data.cuid,
              displayName: data.displayName,
            };
          })();
        })
        .catch(() => {
          (Alpine.store("user") as { loading: boolean }).loading = false;
        });
    },
  });

  Alpine.store("socket", {
    io: null as Socket | null,
    init() {
      if (!Cookies.get("token")) return;
      (Alpine.store("socket") as { io: Socket }).io = io(
        import.meta.env.VITE_BACKEND_URL,
        {
          auth: {
            token: Cookies.get("token"),
          },
        },
      );
    },
  });

  Alpine.data("controlledDiv", () => ({
    value: "",
    init() {
      const $this = this;
      this.$el.addEventListener("keydown", function (event) {
        $this.value = (event.target as HTMLDivElement).innerText;
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();

          (
            Alpine.store("watchedConversation") as {
              send: (text: string) => Promise<void>;
            }
          ).send($this.value);

          $this.value = "";
          (event.target as HTMLDivElement).innerText = "";
        }
      });
    },
  }));

  Alpine.store("userList", {
    data: [],
    find: (search: string) => {
      client
        .get("/chat/find", {
          params: { search },
        })
        .then(({ data }) => {
          (Alpine.store("userList") as { data: any[] }).data = data;
        })
        .catch(() => {});
    },
  });

  Alpine.store("watchedConversation", {
    cuid: "",
    info: {},
    conversation: null,
    publicKey: "",
    async send(text: string) {
      const watched = Alpine.store("watchedConversation") as {
        cuid: string;
        info: any;
        conversation: any;
        publicKey: string;
      };
      const user = (Alpine.store("user") as { data: User }).data;

      const chat = {
        sender: {
          cuid: user.cuid,
          displayName: user.displayName,
        },
        text,
      };

      if (!watched.conversation) {
        (
          Alpine.store("watchedConversation") as {
            conversation: any;
          }
        ).conversation = await (
          Alpine.store("rxdb") as { db: RxDatabase }
        ).db.conversations.insert({
          cuid: watched.cuid,
          conversationInfo: {
            cuid: watched.cuid,
            displayName: watched.info.displayName,
          },
          chats: [chat],
        });
      } else {
        const copy = watched.conversation.chats.slice(0);
        copy.push(chat);

        (
          Alpine.store("watchedConversation") as {
            conversation: any;
          }
        ).conversation = await (
          watched.conversation as RxDocument<{ chats: any[] }>
        ).patch({
          chats: copy,
        });
      }

      await (
        Alpine.store("chatList") as { begin: () => Promise<void> }
      ).begin();

      client
        .post("/chat/" + watched.cuid, encrypt(watched.publicKey, chat))
        .catch(() => {});
    },
    init() {
      (Alpine.store("socket") as { io: Socket }).io.on(
        "conversationInfo",
        (data) => {
          (Alpine.store("watchedConversation") as { info: any }).info = data;
        },
      );
    },
    watch(cuid: string) {
      (async () => {
        (Alpine.store("watchedConversation") as { cuid: string }).cuid = cuid;
        (
          Alpine.store("watchedConversation") as { publicKey: string }
        ).publicKey = "";
        (Alpine.store("watchedConversation") as { info: any }).info = {};
        (
          Alpine.store("watchedConversation") as { conversation: any }
        ).conversation = await (
          Alpine.store("rxdb") as { db: RxDatabase }
        ).db.conversations
          .findOne(cuid)
          .exec();

        await client
          .get("/chat/key/" + cuid)
          .then(({ data }) => {
            (
              Alpine.store("watchedConversation") as { publicKey: string }
            ).publicKey = data;
          })
          .catch(() => {});

        const before = (Alpine.store("watchedConversation") as { cuid: string })
          .cuid;
        const io = (Alpine.store("socket") as { io: Socket }).io;
        if (before) {
          io.emit(`leave:user:info`, {
            cuid: before,
          });
        }

        io.emit(`user:info`, { cuid });
      })();
    },
  });

  Alpine.store("chatList", {
    data: [] as RxDocument[],
    async begin() {
      (Alpine.store("chatList") as { data: RxDocument[] }).data = await (
        Alpine.store("rxdb") as { db: RxDatabase }
      ).db.conversations
        .find()
        .exec();
    },
  });
});
